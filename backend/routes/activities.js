const router = require('express').Router();
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../config/db');
const { auth, allow } = require('../middleware/auth');

const staff = allow('admin', 'coordinator');

// List all activities with attendance count (everyone logged in)
router.get('/', auth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.activity_id, a.title, a.description, a.category, a.venue, a.start_time, a.end_time,
            (SELECT COUNT(*) FROM attendance t WHERE t.activity_id = a.activity_id) AS present,
            (SELECT COUNT(*) FROM attendance t WHERE t.activity_id = a.activity_id AND t.user_id = ?) AS i_attended,
            (SELECT COUNT(*) FROM feedback f WHERE f.activity_id = a.activity_id AND f.user_id = ?) AS i_gave_feedback
     FROM activities a ORDER BY a.start_time DESC`,
    [req.user.id, req.user.id]
  );
  res.json(rows);
});

router.post('/', auth, staff, async (req, res) => {
  const { title, description, category, venue, start_time, end_time } = req.body;
  if (!title || !category || !venue || !start_time || !end_time)
    return res.status(400).json({ error: 'Title, category, venue, start and end time are required' });
  if (new Date(end_time) <= new Date(start_time))
    return res.status(400).json({ error: 'End time must be after start time' });
  const token = crypto.randomBytes(16).toString('hex');
  const [r] = await db.query(
    `INSERT INTO activities (title, description, category, venue, start_time, end_time, qr_token, created_by)
     VALUES (?,?,?,?,?,?,?,?)`,
    [title, description || '', category, venue, start_time, end_time, token, req.user.id]
  );
  res.status(201).json({ activity_id: r.insertId });
});

router.put('/:id', auth, staff, async (req, res) => {
  const { title, description, category, venue, start_time, end_time } = req.body;
  await db.query(
    `UPDATE activities SET title=?, description=?, category=?, venue=?, start_time=?, end_time=? WHERE activity_id=?`,
    [title, description || '', category, venue, start_time, end_time, req.params.id]
  );
  res.json({ message: 'Updated' });
});

router.delete('/:id', auth, staff, async (req, res) => {
  await db.query('DELETE FROM activities WHERE activity_id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// QR code image. It encodes a link; scanning it with a phone camera opens the attendance page.
router.get('/:id/qr', auth, staff, async (req, res) => {
  const [rows] = await db.query('SELECT qr_token FROM activities WHERE activity_id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Activity not found' });
  const url = `${process.env.FRONTEND_URL}/attend/${rows[0].qr_token}`;
  res.json({ url, qr: await QRCode.toDataURL(url, { width: 320, margin: 2 }) });
});

module.exports = router;
