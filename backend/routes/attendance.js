const router = require('express').Router();
const db = require('../config/db');
const { auth, allow } = require('../middleware/auth');

const staff = allow('admin', 'coordinator');
const EARLY_MINUTES = 30; // QR opens 30 min before start

// Participant scans QR -> this endpoint runs
router.post('/qr', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM activities WHERE qr_token = ?', [req.body.token]);
    const a = rows[0];
    if (!a) return res.status(404).json({ error: 'Invalid QR code' });

    const now = new Date();
    const opens = new Date(new Date(a.start_time).getTime() - EARLY_MINUTES * 60000);
    if (now < opens) return res.status(400).json({ error: 'Attendance has not opened yet' });
    if (now > new Date(a.end_time)) return res.status(400).json({ error: 'Activity has ended, attendance closed' });

    await db.query('INSERT INTO attendance (activity_id, user_id, method) VALUES (?,?,?)',
      [a.activity_id, req.user.id, 'qr']);
    res.status(201).json({ message: `Attendance marked for "${a.title}"` });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'You are already marked present' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Coordinator marks someone manually
router.post('/manual', auth, staff, async (req, res) => {
  try {
    await db.query('INSERT INTO attendance (activity_id, user_id, method) VALUES (?,?,?)',
      [req.body.activity_id, req.body.user_id, 'manual']);
    res.status(201).json({ message: 'Marked present' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Already marked present' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Who attended an activity
router.get('/activity/:id', auth, staff, async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.user_id, u.name, u.phone, t.marked_at, t.method
     FROM attendance t JOIN users u ON u.user_id = t.user_id
     WHERE t.activity_id = ? ORDER BY t.marked_at`, [req.params.id]);
  res.json(rows);
});

// List of volunteers (for manual marking)
router.get('/volunteers', auth, staff, async (req, res) => {
  const [rows] = await db.query("SELECT user_id, name, phone FROM users WHERE role = 'volunteer' ORDER BY name");
  res.json(rows);
});

module.exports = router;
