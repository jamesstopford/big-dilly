import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, run, get, all, closeDb } from '../src/db/database.js';

describe('Database utilities', () => {
  beforeAll(() => {
    // Use test database
    process.env.DB_PATH = ':memory:';
    const db = getDb();

    // Create tables for testing
    db.exec(`
      CREATE TABLE IF NOT EXISTS test_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value INTEGER DEFAULT 0
      );
    `);
  });

  afterAll(() => {
    closeDb();
  });

  it('should run insert queries', () => {
    const result = run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['test1', 10]);
    expect(result.lastInsertRowid).toBe(1);
    expect(result.changes).toBe(1);
  });

  it('should get a single row', () => {
    run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['test2', 20]);
    const row = get('SELECT * FROM test_items WHERE name = ?', ['test2']);
    expect(row).toBeDefined();
    expect(row.name).toBe('test2');
    expect(row.value).toBe(20);
  });

  it('should get all matching rows', () => {
    run('INSERT INTO test_items (name, value) VALUES (?, ?)', ['test3', 30]);
    const rows = all('SELECT * FROM test_items ORDER BY id');
    expect(rows.length).toBe(3);
    expect(rows[0].name).toBe('test1');
    expect(rows[2].name).toBe('test3');
  });

  it('should return undefined for missing rows', () => {
    const row = get('SELECT * FROM test_items WHERE name = ?', ['nonexistent']);
    expect(row).toBeUndefined();
  });
});
