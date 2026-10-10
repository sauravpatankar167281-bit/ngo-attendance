const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const sign = (u) =>
  jwt.sign({ id: u.user_id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '1d' });

// Public registration always creates a volunteer
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !email || !password || password.length < 6)
      return res.status(400).json({ error: 'All fields required, password min 6 characters' });
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, phone, email, role, password_hash) VALUES (?,?,?,?,?)',
      [name.trim(), phone.trim(), email.trim().toLowerCase(), 'volunteer', hash]
    );
    res.status(201).json({ message: 'Registered. Please login.' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Phone or email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [(email || '').toLowerCase()]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
      return res.status(401).json({ error: 'Wrong email or password' });
    res.json({ token: sign(u), user: { id: u.user_id, name: u.name, role: u.role } });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
