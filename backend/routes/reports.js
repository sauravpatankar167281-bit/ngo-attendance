const router = require('express').Router();
const db = require('../config/db');
const { auth, allow } = require('../middleware/auth');

const staff = allow('admin', 'coordinator');

// Dashboard summary: one row per activity
router.get('/summary', auth, staff, async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.activity_id, a.title, a.category, a.start_time,
            COUNT(DISTINCT t.user_id) AS present,
            COUNT(DISTINCT f.user_id) AS feedback_count,
            ROUND(AVG(f.rating), 1)   AS avg_rating
     FROM activities a
     LEFT JOIN attendance t ON t.activity_id = a.activity_id
     LEFT JOIN feedback  f ON f.activity_id = a.activity_id
     GROUP BY a.activity_id ORDER BY a.start_time DESC`);
  const [[tot]] = await db.query(
    `SELECT (SELECT COUNT(*) FROM activities) AS activities,
            (SELECT COUNT(*) FROM users WHERE role='volunteer') AS volunteers,
            (SELECT COUNT(*) FROM attendance) AS total_attendance,
            (SELECT ROUND(AVG(rating),1) FROM feedback) AS overall_rating`);
  res.json({ totals: tot, activities: rows });
});

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

// CSV export of attendance + feedback for one activity
router.get('/export/:id', auth, staff, async (req, res) => {
  const [acts] = await db.query('SELECT title FROM activities WHERE activity_id = ?', [req.params.id]);
  if (!acts[0]) return res.status(404).json({ error: 'Activity not found' });
  const [rows] = await db.query(
    `SELECT u.name, u.phone, t.marked_at, t.method, f.rating, f.comment
     FROM attendance t
     JOIN users u ON u.user_id = t.user_id
     LEFT JOIN feedback f ON f.activity_id = t.activity_id AND f.user_id = t.user_id
     WHERE t.activity_id = ? ORDER BY t.marked_at`, [req.params.id]);
  const head = ['Name', 'Phone', 'Marked At', 'Method', 'Rating', 'Comment'];
  const lines = [head.join(','), ...rows.map(r =>
    [r.name, r.phone, r.marked_at, r.method, r.rating, r.comment].map(csvCell).join(','))];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="activity-${req.params.id}-report.csv"`);
  res.send(lines.join('\n'));
});

module.exports = router;
