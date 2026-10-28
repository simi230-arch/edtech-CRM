const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let db = null;
let SQL = null;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'crm.sqlite');

async function initDB() {
  if (db) return db;

  SQL = await initSqlJs();
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error reading existing database file, creating fresh:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Enforce foreign key constraints
  db.run('PRAGMA foreign_keys = ON;');

  // Run schema migrations
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.run(schemaSql);
  }

  saveDB();
  return db;
}

function saveDB() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

function sanitizeParams(params) {
  if (!params || !Array.isArray(params)) return [];
  return params.map(p => (p === undefined ? null : p));
}

function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  const stmt = db.prepare(sql);
  const cleanParams = sanitizeParams(params);
  if (cleanParams.length > 0) {
    stmt.bind(cleanParams);
  }
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  const stmt = db.prepare(sql);
  const cleanParams = sanitizeParams(params);
  if (cleanParams.length > 0) {
    stmt.bind(cleanParams);
  }
  stmt.step();
  stmt.free();
  
  // Get last insert row id and changes
  const lastRow = query('SELECT last_insert_rowid() AS id, changes() AS changes');
  const lastInsertRowid = lastRow[0] ? lastRow[0].id : null;
  const changes = lastRow[0] ? lastRow[0].changes : 0;
  
  saveDB();
  return { lastInsertRowid, changes };
}

function transaction(fn) {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  db.run('BEGIN TRANSACTION');
  try {
    const result = fn({ query, get, run });
    db.run('COMMIT');
    saveDB();
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

module.exports = {
  initDB,
  saveDB,
  query,
  get,
  run,
  transaction,
  getDBPath: () => DB_PATH
};
