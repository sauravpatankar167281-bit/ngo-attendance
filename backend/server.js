require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
