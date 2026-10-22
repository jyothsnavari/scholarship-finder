const express = require('express');
const User = require('../models/User');
const Scholarship = require('../models/Scholarship');
const { asyncHandler, authenticate, requireRole } = require('../middleware/auth');
const { evaluate } = require('../utils/matching');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const studentRow = (u) => {
  const t = u.tracked || [];
  return {
    id: u._id, name: u.name, email: u.email, familyIncome: u.familyIncome,
    category: u.category || '', gender: u.gender || '', course: u.course || '',
    year: u.year ?? '', state: u.state || '', marks: u.marks ?? '',
    emailVerified: u.emailVerified !== false,
    saved: t.filter((x) => x.status === 'saved').length,
    applied: t.filter((x) => x.status === 'applied').length,
    joined: u.createdAt,
  };
};

router.get('/students', asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).sort({ createdAt: -1 }).lean();
  res.json({ students: students.map(studentRow) });
}));

// Spreadsheet apps run text starting with = + - @ as formulas, so neutralise those
const csvCell = (v) => {
  let s = v === undefined || v === null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

router.get('/students.csv', asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).sort({ createdAt: -1 }).lean();
  const cols = ['name', 'email', 'familyIncome', 'category', 'gender', 'course', 'year', 'state', 'marks', 'emailVerified', 'saved', 'applied', 'joined'];
  const lines = [cols.join(',')];
  for (const s of students.map(studentRow)) {
    lines.push(cols.map((c) => csvCell(c === 'joined' ? new Date(s.joined).toISOString().slice(0, 10) : s[c])).join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
  res.send(lines.join('\n'));
}));

router.get('/admins', asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 }).lean();
  res.json({ admins: admins.map((a) => ({ id: a._id, name: a.name, email: a.email, joined: a.createdAt })) });
}));

router.post('/admins', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists' });
  const admin = await User.create({ name, email, password, role: 'admin' });
  res.status(201).json({ admin: { id: admin._id, name: admin.name, email: admin.email } });
}));

// Per-scholarship numbers: students who match, saves, applied marks and Apply-now clicks
router.get('/stats', asyncHandler(async (req, res) => {
  const [students, scholarships] = await Promise.all([
    User.find({ role: 'student' }).lean(),
    Scholarship.find().sort({ deadline: 1 }).lean(),
  ]);
  const today = startOfToday();
  const rows = scholarships.map((s) => {
    let saved = 0;
    let applied = 0;
    for (const st of students) {
      for (const t of st.tracked || []) {
        if (String(t.scholarship) === String(s._id)) (t.status === 'applied' ? (applied += 1) : (saved += 1));
      }
    }
    return {
      id: s._id, title: s.title, provider: s.provider, amount: s.amount, deadline: s.deadline,
      expired: new Date(s.deadline) < today,
      matched: students.filter((st) => evaluate(st, s).status === 'match').length,
      saved, applied, clicks: s.applyClicks || 0,
    };
  });
  res.json({
    totals: {
      students: students.length,
      scholarships: rows.length,
      active: rows.filter((r) => !r.expired).length,
      expired: rows.filter((r) => r.expired).length,
    },
    scholarships: rows,
  });
}));

module.exports = router;