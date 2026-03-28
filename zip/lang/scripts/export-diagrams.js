#!/usr/bin/env node
// scripts/export-diagrams.js
//
// One-time (and re-runnable) script that:
//   1. Renders every React diagram component from JavaDiagrams.tsx to a
//      static HTML string using react-dom/server + esbuild in-process.
//   2. Upserts each result into the diagrams table.
//
// Usage:
//   node scripts/export-diagrams.js
//   node scripts/export-diagrams.js --dry-run   (print output, skip DB)
//
// Requirements (install once in the backend dir):
//   npm install --save-dev esbuild react react-dom
//
// The script must be run from the lang/ directory so relative paths resolve.

'use strict';

require('dotenv').config();

const path     = require('path');
const fs       = require('fs');
const esbuild  = require('esbuild');
const { Pool } = require('pg');

const isDryRun = process.argv.includes('--dry-run');

// ── Path to the frontend diagrams file ───────────────────────────────────────
const DIAGRAMS_TSX = path.resolve(
  __dirname, '../../LANGFRONT/src/components/diagrams/JavaDiagrams.tsx'
);

// ── Diagram key → DB diagram_key mapping ─────────────────────────────────────
// Registry keys (from DIAGRAM_REGISTRY in JavaDiagrams.tsx) → canonical DB keys.
// We prefix with "java_" to namespace by language.
const KEY_MAP = {
  jvm:           'java_jvm',
  memory:        'java_memory',
  operators:     'java_operators',
  controlflow:   'java_controlflow',
  arrays:        'java_arrays',
  callstack:     'java_callstack',
  stringpool:    'java_stringpool',
  classobject:   'java_classobject',
  inheritance:   'java_inheritance',
  polymorphism:  'java_polymorphism',
  abstraction:   'java_abstraction',
  encapsulation: 'java_encapsulation',
  interfaces:    'java_interfaces',
  collections:   'java_collections',
  exceptions:    'java_exceptions',
  generics:      'java_generics',
  threads:       'java_threads',
  streams:       'java_streams',
  fileio:        'java_fileio',
};

// ── Build & evaluate JavaDiagrams.tsx in-process ─────────────────────────────
async function buildDiagramModule() {
  if (!fs.existsSync(DIAGRAMS_TSX)) {
    throw new Error(`JavaDiagrams.tsx not found at: ${DIAGRAMS_TSX}`);
  }

  // Inline a minimal C theme so the module doesn't crash when imported
  // outside the Vite context. Colors match the real theme.ts values.
  const themeMock = `
    export const C = {
      bg:'#06060f', sidebar:'#04040c', card:'#0d0d20', hover:'#12122a',
      border:'#1c1c3a', java:'#f59e0b', oop:'#fb923c', adv:'#e879f9',
      dsa:'#a78bfa', spring:'#4ade80', devops:'#22d3ee', text:'#e2e8f0',
      muted:'#94a3b8', dim:'#4b5563', codeBg:'#1e1e2e', success:'#4ade80',
      error:'#f87171', warn:'#fbbf24',
    };
    export function hexToRgb(h){
      const s=h.replace('#','');
      return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16);
    }
    export function colorRgb(h){ return hexToRgb(h??'#f59e0b'); }
    export const DEFAULT_COLOR='#f59e0b';
  `;

  // Inject theme mock as a virtual module so the real theme.ts import resolves
  const themePlugin = {
    name: 'theme-mock',
    setup(build) {
      build.onResolve({ filter: /\/theme$/ }, () => ({
        path: 'theme-mock', namespace: 'theme-mock',
      }));
      build.onLoad({ filter: /.*/, namespace: 'theme-mock' }, () => ({
        contents: themeMock, loader: 'js',
      }));
    },
  };

  const result = await esbuild.build({
    entryPoints: [DIAGRAMS_TSX],
    bundle:      true,
    platform:    'node',
    format:      'cjs',
    write:       false,
    loader:      { '.tsx': 'tsx', '.ts': 'ts' },
    external:    ['react', 'react-dom'],
    plugins:     [themePlugin],
    logLevel:    'silent',
  });

  // Evaluate the bundle in the current Node process
  const code = result.outputFiles[0].text;
  const mod  = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
  return mod.exports;
}

// ── Render one component to static HTML ───────────────────────────────────────
function renderComponent(Component) {
  const React        = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  return renderToStaticMarkup(React.createElement(Component));
}

// ── DB upsert ─────────────────────────────────────────────────────────────────
async function upsertDiagram(db, { diagramKey, title, svg }) {
  await db.query(`
    INSERT INTO diagrams (diagram_key, title, type, data)
    VALUES ($1, $2, 'svg', $3::jsonb)
    ON CONFLICT (diagram_key) DO UPDATE SET
      title = EXCLUDED.title,
      type  = EXCLUDED.type,
      data  = EXCLUDED.data
  `, [diagramKey, title, JSON.stringify({ svg })]);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Diagram Export Script\n');

  let db;
  if (!isDryRun) {
    db = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  }

  try {
    console.log('Building JavaDiagrams.tsx...');
    const diagramModule = await buildDiagramModule();
    const registry = diagramModule.DIAGRAM_REGISTRY ?? diagramModule.default;

    if (!registry || typeof registry !== 'object') {
      throw new Error('Could not find DIAGRAM_REGISTRY export in JavaDiagrams.tsx');
    }

    console.log(`Found ${Object.keys(registry).length} diagrams\n`);

    let ok = 0, failed = 0;

    for (const [registryKey, Component] of Object.entries(registry)) {
      const diagramKey = KEY_MAP[registryKey];
      if (!diagramKey) {
        console.log(`  SKIP  ${registryKey} — no KEY_MAP entry`);
        continue;
      }

      try {
        const html  = renderComponent(Component);
        const title = registryKey.charAt(0).toUpperCase() + registryKey.slice(1);

        if (isDryRun) {
          console.log(`  DRY   ${diagramKey}  (${html.length} chars)`);
        } else {
          await upsertDiagram(db, { diagramKey, title, svg: html });
          console.log(`  ✓     ${diagramKey}  (${html.length} chars)`);
        }
        ok++;
      } catch (err) {
        console.log(`  ✗     ${registryKey}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\nDone: ${ok} exported, ${failed} failed`);
    if (isDryRun) console.log('(dry-run — no DB writes)');

  } finally {
    if (db) await db.end();
  }
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});