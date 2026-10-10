// Run once: npm run seed  -> creates demo admin, coordinator, volunteers and 2 activities
require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./config/db');

(async () => {
  const hash = await bcrypt.hash('password123', 10);
  const users = [
    ['Admin User', '9000000001', 'admin@ngo.org', 'admin'],
    ['Coordinator Priya', '9000000002', 'coord@ngo.org', 'coordinator'],
    ['Volunteer Rahul', '9000000003', 'rahul@ngo.org', 'volunteer'],
    ['Volunteer Sneha', '9000000004', 'sneha@ngo.org', 'volunteer'],
  ];
  for (const [n, p, e, r] of users)
    await db.query('INSERT IGNORE INTO users (name, phone, email, role, password_hash) VALUES (?,?,?,?,?)', [n, p, e, r, hash]);

  const [[c]] = await db.query("SELECT user_id FROM users WHERE email = 'coord@ngo.org'");
  // local time, same clock the API uses when comparing times
  const fmt = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ');
  const now = Date.now(), H = 3600000;
  const acts = [
    ['Health Checkup Camp', 'Free BP and sugar checks', 'Health', 'Community Hall', fmt(new Date(now - 30 * H)), fmt(new Date(now - 26 * H))],
    ['Tree Plantation Drive', 'Plant 100 saplings', 'Environment', 'Riverside Park', fmt(new Date(now - 1 * H)), fmt(new Date(now + 3 * H))],
  ];
  for (const a of acts)
    await db.query(
      `INSERT INTO activities (title, description, category, venue, start_time, end_time, qr_token, created_by)
       VALUES (?,?,?,?,?,?,?,?)`, [...a, crypto.randomBytes(16).toString('hex'), c.user_id]);

  console.log('Seeded. Login with any demo email and password: password123');
  process.exit(0);
})();
