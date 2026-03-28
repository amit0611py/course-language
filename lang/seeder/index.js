#!/usr/bin/env node
// seeder/index.js
//
// Content-as-Code ETL pipeline.
// Reads from content/ directory tree → upserts into PostgreSQL.
//
// Usage:
//   node seeder/index.js              # seed all languages
//   node seeder/index.js --lang java  # seed one language
//   node seeder/index.js --path java.jvm.memory  # seed one topic file

'use strict';

require('dotenv').config();
const path                 = require('path');
const fs                   = require('fs');
const { Pool }             = require('pg');
const { parseMarkdownTopic } = require('./parsers/markdownParser');
const { loadLanguage }     = require('./loaders/languageLoader');
const { loadTopic }        = require('./loaders/topicLoader');

const CONTENT_DIR = path.join(__dirname, '../content/languages');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

// ── CLI argument parsing ─────────────────────────────────────────────────────
//
// Supports all of these invocations:
//   node seeder/index.js                       → seed all languages
//   node seeder/index.js java                  → seed language (positional)
//   node seeder/index.js --lang java           → seed language (flag)
//   node seeder/index.js --path java.intro     → seed one topic
//   npm run seed -- --lang java                → seed language via npm
//   npm run seed:lang java                     → seed language via npm alias

const args = process.argv.slice(2);

// Safe flag lookup — never falls back to args[0] when flag is absent.
const flagValue = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
};

const langArg    = flagValue('--lang');
const pathArg    = flagValue('--path');
const verboseArg = args.includes('--verbose');

// Positional: first argument that doesn't start with '-'
// e.g. "node seeder/index.js java"  →  positional = 'java'
const positional = args.find((a) => !a.startsWith('-')) ?? null;

// ── Utilities ────────────────────────────────────────────────────────────────

const log = (msg) => console.log(msg);
const verbose = (msg) => verboseArg && console.log(msg);

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ── Language seeder ──────────────────────────────────────────────────────────

const seedLanguage = async (languageDir) => {
  const langName = path.basename(languageDir);

  const langConfigPath = path.join(languageDir, 'language.json');
  if (!fs.existsSync(langConfigPath)) {
    log(`  SKIP  ${langName}: no language.json`);
    return;
  }

  const langConfig = readJson(langConfigPath);
  await loadLanguage(db, langConfig);
  log(`  ✓ Language: ${langConfig.slug}`);

  // Topic files
  const topicsDir = path.join(languageDir, 'topics');
  if (!fs.existsSync(topicsDir)) {
    log(`    (no topics directory)`);
    return;
  }

  const mdFiles = fs
    .readdirSync(topicsDir)
    .filter((f) => f.endsWith('.md'))
    .sort(); // alphabetical order = depth order for dot-separated names

  // Sort by depth so parent topics are always upserted before their children.
  // File names mirror paths: 'java.jvm.md' < 'java.jvm.memory.md' naturally
  // because fewer dots comes first alphabetically.

  let topicCount = 0;
  let errCount   = 0;

  for (const file of mdFiles) {
    const filePath = path.join(topicsDir, file);
    try {
      const raw     = fs.readFileSync(filePath, 'utf8');
      const parsed  = parseMarkdownTopic(raw);
      await loadTopic(db, parsed);
      verbose(`    ✓ topic: ${parsed.meta.path}`);
      topicCount++;
    } catch (err) {
      log(`    ✗ ${file}: ${err.message}`);
      errCount++;
    }
  }

  log(`    → ${topicCount} topics seeded, ${errCount} errors`);
};

// ── Single topic seeder ──────────────────────────────────────────────────────

const seedOneTopic = async (topicPath) => {
  const langSlug = topicPath.split('.')[0];
  const filePath = path.join(
    CONTENT_DIR, langSlug, 'topics', `${topicPath}.md`
  );

  if (!fs.existsSync(filePath)) {
    log(`ERROR: file not found: ${filePath}`);
    process.exit(1);
  }

  const raw    = fs.readFileSync(filePath, 'utf8');
  const parsed = parseMarkdownTopic(raw);
  await loadTopic(db, parsed);
  log(`✓ Seeded: ${parsed.meta.path}`);
};

// ── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  log('Content Engine Seeder\n');

  // Resolve effective targets:
  //   --path  → single topic
  //   --lang or positional → single language
  //   neither → all languages
  const effectivePath = pathArg;
  const effectiveLang = langArg ?? positional;

  try {
    if (effectivePath) {
      await seedOneTopic(effectivePath);
    } else if (effectiveLang) {
      await seedLanguage(path.join(CONTENT_DIR, effectiveLang));
    } else {
      // Seed all languages
      const dirs = fs
        .readdirSync(CONTENT_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(CONTENT_DIR, d.name));

      for (const dir of dirs) {
        await seedLanguage(dir);
      }
    }

    log('\nSeeder finished successfully.');
  } catch (err) {
    log(`\nSeeder failed: ${err.message}`);
    if (verboseArg) console.error(err);
    process.exit(1);
  } finally {
    await db.end();
  }
};

main();
