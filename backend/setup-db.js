require('dotenv').config();
const mysql = require('mysql2/promise');

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
const DB = process.env.DB_NAME;

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    role ENUM('admin','coordinator','volunteer') NOT NULL DEFAULT 'volunteer',
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    venue VARCHAR(150) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    qr_token VARCHAR(64) NOT NULL UNIQUE,
    created_by INT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS attendance (
    att_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method ENUM('qr','manual') NOT NULL,
    UNIQUE KEY uq_att (activity_id, user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(activity_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS feedback (
    fb_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment VARCHAR(500),
    is_anonymous BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fb (activity_id, user_id),
    FOREIGN KEY (activity_id) REFERENCES activities(activity_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  )`,
];

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl,
  });
  await c.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\``);
  await c.query(`USE \`${DB}\``);
  for (const sql of statements) await c.query(sql);
  console.log(`Tables created in database "${DB}"`);
  await c.end();
  process.exit(0);
})().catch((e) => { console.error('Setup failed:', e.message); process.exit(1); });