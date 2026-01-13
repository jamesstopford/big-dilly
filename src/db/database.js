import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/big-dilly.db');

let db = null;

/**
 * Get or create the database connection
 * @returns {Database.Database} SQLite database instance
 */
export function getDb() {
  if (!db) {
    // Ensure the data directory exists
    const dataDir = path.dirname(dbPath);
    import('fs').then(fs => {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    });

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * Run a query that modifies data (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL query
 * @param {any[]} params - Query parameters
 * @returns {Database.RunResult} Result with lastInsertRowid and changes
 */
export function run(sql, params = []) {
  const stmt = getDb().prepare(sql);
  return stmt.run(...params);
}

/**
 * Get a single row from the database
 * @param {string} sql - SQL query
 * @param {any[]} params - Query parameters
 * @returns {any} Single row or undefined
 */
export function get(sql, params = []) {
  const stmt = getDb().prepare(sql);
  return stmt.get(...params);
}

/**
 * Get all rows from the database
 * @param {string} sql - SQL query
 * @param {any[]} params - Query parameters
 * @returns {any[]} Array of rows
 */
export function all(sql, params = []) {
  const stmt = getDb().prepare(sql);
  return stmt.all(...params);
}

/**
 * Run multiple queries in a transaction
 * @param {Function} fn - Function containing queries to run
 * @returns {any} Result of the transaction function
 */
export function transaction(fn) {
  return getDb().transaction(fn)();
}

/**
 * Close the database connection
 */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export default {
  getDb,
  run,
  get,
  all,
  transaction,
  closeDb
};
