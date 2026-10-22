require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { asyncHandler } = require('./middleware/auth');
const { sendDeadlineReminders } = require('./utils/reminders');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Call this daily from a free scheduler (e.g. cron-job.org) with ?key=CRON_SECRET.
app.all('/api/jobs/reminders', asyncHandler(async (req, res) => {
  const key = req.get('x-cron-key') || req.query.key;
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return res.status(401).json({ message: 'Unauthorized' });
  res.json(await sendDeadlineReminders());
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/scholarships', require('./routes/scholarships'));
app.use('/api/admin', require('./routes/admin'));

app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid value or id' });
  if (err.code === 11000) return res.status(409).json({ message: 'That value already exists' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    cron.schedule('0 8 * * *', () => sendDeadlineReminders().catch((e) => console.error('Reminders failed:', e.message)));
  })
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });