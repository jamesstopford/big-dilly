#!/usr/bin/env node
/**
 * Database initialization script
 * Run with: npm run db:init
 */

import { getDb, closeDb } from './database.js';
import { schema, indexes } from './schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');

/**
 * Initialize the database with schema and indexes
 */
function initializeDatabase() {
  console.log('Initializing database...');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory');
  }

  const db = getDb();

  // Run schema creation
  console.log('Creating tables...');
  db.exec(schema);

  // Run index creation
  console.log('Creating indexes...');
  db.exec(indexes);

  console.log('Database initialized successfully!');

  // Verify tables were created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    ORDER BY name
  `).all();

  console.log('Tables created:', tables.map(t => t.name).join(', '));

  closeDb();
}

// Run if called directly
initializeDatabase();

export { initializeDatabase };
