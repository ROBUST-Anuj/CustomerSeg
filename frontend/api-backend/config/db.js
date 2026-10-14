const knex = require('knex');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbClient = process.env.DB_CLIENT || (process.env.DATABASE_URL ? 'mysql' : 'sqlite3');
const databaseUrl = process.env.DATABASE_URL;

let db;

if (databaseUrl) {
  // Cloud connection string provided
  const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
  const clientType = isPostgres ? 'pg' : 'mysql2';

  db = knex({
    client: clientType,
    connection: databaseUrl,
    pool: { min: 2, max: 10 },
    acquireConnectionTimeout: 20000
  });
  console.log(`[Database] Configured via DATABASE_URL using client '${clientType}'`);
} else if (dbClient === 'mysql' && (process.env.DB_HOST || process.env.MYSQLHOST)) {
  const host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306;
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'customerseg_db';

  const useSsl = process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && host !== '127.0.0.1' && host !== 'localhost');

  db = knex({
    client: 'mysql2',
    connection: {
      host,
      port,
      user,
      password,
      database,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined
    },
    pool: { min: 2, max: 10 },
    acquireConnectionTimeout: 20000
  });
  console.log(`[Database] Configured for MySQL host '${host}:${port}', database '${database}' (SSL: ${useSsl})`);
} else {
  // Use persistent SQLite for local development & testing
  const dbDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'customerseg.sqlite');

  db = knex({
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  });
  console.log('[Database] Configured for SQLite storage at:', dbPath);
}

module.exports = db;
