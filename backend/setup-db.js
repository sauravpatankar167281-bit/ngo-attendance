require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8')
    .replace(/CREATE DATABASE.*?;/i, '').replace(/USE .*?;/i, '');
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, multipleStatements: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await c.query(sql);
  console.log('Tables created');
  process.exit(0);
})();