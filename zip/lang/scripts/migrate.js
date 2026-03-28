#!/usr/bin/env node
// scripts/migrate.js
// Runs all SQL migration files in order against the configured DATABASE_URL.
// Usage:
//   node scripts/migrate.js          → run all pending migrations
//   node scripts/migrate.js --reset  → DROP all tables then re-run (dev only)

'use strict';

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function run() {
  const isReset = process.argv.includes('--reset');
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    if (isReset) {
      if (process.env.NODE_ENV === 'production') {
        console.error('ERROR: --reset is not allowed in production.');
        process.exit(1);
      }
      console.log('Resetting database...');
      await client.query(`
        DROP TABLE IF EXISTS
          user_progress,
          project_technologies,
          projects,
          technologies,
          quiz_questions,
          diagrams,
          topics,
          sections,
          languages
        CASCADE;
      `);
      console.log('All tables dropped.');
    }

    // Ensure migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         SERIAL PRIMARY KEY,
        filename   TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query(
      'SELECT filename FROM _migrations ORDER BY filename'
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // Get all migration files, sorted by name
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  skip  ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  apply ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  FAIL  ${file}: ${err.message}`);
        throw err;
      }
    }

    console.log(`\nDone. ${count} migration(s) applied.`);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
