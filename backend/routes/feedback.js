const router = require('express').Router();
const db = require('../config/db');
const { auth, allow } = require('../middleware/auth');

// Feedback opens only after the activity ends, and only for people who attended
router.post('/', auth, async (req, res) => {
  try {
    const { activity_id, rating, comment, is_anonymous } = req.body;
    const r = Number(rating);
    if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'Rating must be 1 to 5' });

    const [acts] = await db.query('SELECT end_time FROM activities WHERE activity_id = ?', [activity_id]);
    if (!acts[0]) return res.status(404).json({ error: 'Activity not found' });
    if (new Date() < new Date(acts[0].end_time))
      return res.status(400).json({ error: 'Feedback opens after the activity ends' });

    const [att] = await db.query('SELECT 1 FROM attendance WHERE activity_id=? AND user_id=?', [activity_id, req.user.id]);
    if (!att[0]) return res.status(403).json({ error: 'Only attendees can give feedback' });

    await db.query(
      'INSERT INTO feedback (activity_id, user_id, rating, comment, is_anonymous) VALUES (?,?,?,?,?)',
      [activity_id, req.user.id, r, (comment || '').slice(0, 500), !!is_anonymous]);
    res.status(201).json({ message: 'Thank you for your feedback!' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'You already submitted feedback' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Staff view. Anonymous names are hidden.
router.get('/activity/:id', auth, allow('admin', 'coordinator'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT f.rating, f.comment, f.submitted_at,
            IF(f.is_anonymous, 'Anonymous', u.name) AS name
     FROM feedback f JOIN users u ON u.user_id = f.user_id
     WHERE f.activity_id = ? ORDER BY f.submitted_at DESC`, [req.params.id]);
  res.json(rows);
});

module.exports = router;
