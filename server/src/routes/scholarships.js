const express = require('express');
const Scholarship = require('../models/Scholarship');
const { asyncHandler, authenticate, requireRole } = require('../middleware/auth');
const { evaluate } = require('../utils/matching');
const { CATEGORIES, GENDERS, cleanList, cleanNumbers } = require('../utils/lists');

const router = express.Router();
router.use(authenticate);

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const byAmountThenDeadline = (a, b) =>
  b.scholarship.amount - a.scholarship.amount || new Date(a.scholarship.deadline) - new Date(b.scholarship.deadline);

// Distinct course / state values already used, for form suggestions
router.get('/options', asyncHandler(async (req, res) => {
  const [courses, states] = await Promise.all([Scholarship.distinct('courses'), Scholarship.distinct('states')]);
  res.json({ courses: courses.sort(), states: states.sort() });
}));

// Student: open scholarships that fit, plus "close matches" missing exactly one criterion
router.get('/recommended', requireRole('student'), asyncHandler(async (req, res) => {
  const open = await Scholarship.find({ deadline: { $gte: startOfToday() } }).lean();
  const tracked = new Map(req.user.tracked.map((t) => [String(t.scholarship), t.status]));
  const matches = [];
  const nearMisses = [];
  for (const s of open) {
    const r = evaluate(req.user, s);
    if (r.status === 'none') continue;
    const item = { scholarship: s, reasons: r.reasons, gaps: r.gaps, missing: r.missing, tracked: tracked.get(String(s._id)) || null };
    (r.status === 'match' ? matches : nearMisses).push(item);
  }
  matches.sort(byAmountThenDeadline);
  nearMisses.sort(byAmountThenDeadline);
  res.json({ matches, nearMisses });
}));

// >>> Later features add student routes here <<<
// Student: saved and applied scholarships (including ones that have since closed)
router.get('/tracked', requireRole('student'), asyncHandler(async (req, res) => {
  const list = await Scholarship.find({ _id: { $in: req.user.tracked.map((t) => t.scholarship) } }).lean();
  const byId = new Map(list.map((s) => [String(s._id), s]));
  const today = startOfToday();
  const items = req.user.tracked
    .map((t) => ({ tracked: t.status, scholarship: byId.get(String(t.scholarship)) }))
    .filter((i) => i.scholarship)
    .map((i) => ({ ...i, expired: new Date(i.scholarship.deadline) < today }));
  res.json({ items });
}));

router.put('/:id/track', requireRole('student'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['saved', 'applied', 'none'].includes(status)) return res.status(400).json({ message: 'Status must be saved, applied or none' });
  if (!(await Scholarship.exists({ _id: req.params.id }))) return res.status(404).json({ message: 'Scholarship not found' });

  const idx = req.user.tracked.findIndex((t) => String(t.scholarship) === req.params.id);
  if (status === 'none') {
    if (idx >= 0) req.user.tracked.splice(idx, 1);
  } else if (idx >= 0) {
    req.user.tracked[idx].status = status;
  } else {
    req.user.tracked.push({ scholarship: req.params.id, status });
  }
  await req.user.save();
  res.json({ tracked: status === 'none' ? null : status });
}));

router.post('/:id/click', requireRole('student'), asyncHandler(async (req, res) => {
  await Scholarship.updateOne({ _id: req.params.id }, { $inc: { applyClicks: 1 } });
  res.json({ ok: true });
}));

// ---- Admin ----
router.get('/', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json({ scholarships: await Scholarship.find().sort({ createdAt: -1 }) });
}));

const pick = (b) => ({
  title: b.title,
  provider: b.provider,
  description: b.description,
  amount: b.amount,
  maxFamilyIncome: b.maxFamilyIncome,
  deadline: b.deadline,
  applyLink: b.applyLink,
  categories: cleanList(b.categories, CATEGORIES),
  genders: cleanList(b.genders, GENDERS),
  courses: cleanList(b.courses),
  states: cleanList(b.states),
  years: cleanNumbers(b.years),
  minMarks: b.minMarks === '' || b.minMarks === undefined || b.minMarks === null ? null : Number(b.minMarks),
});

router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.create({ ...pick(req.body), createdBy: req.user._id });
  res.status(201).json({ scholarship });
}));

// >>> Bulk upload route is added here later <<<
// Bulk add from rows parsed from a CSV in the browser. Valid rows are saved, bad rows are reported.
router.post('/bulk', requireRole('admin'), asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows.slice(0, 500) : [];
  const good = [];
  const errors = [];
  for (let i = 0; i < rows.length; i += 1) {
    try {
      const doc = new Scholarship({ ...pick(rows[i]), createdBy: req.user._id });
      await doc.validate();
      good.push(doc);
    } catch (e) {
      const message = e.name === 'ValidationError' ? Object.values(e.errors).map((x) => x.message).join(', ') : e.message;
      errors.push({ row: i + 2, message });
    }
  }
  if (good.length) await Scholarship.insertMany(good);
  res.status(201).json({ inserted: good.length, errors });
}));

router.put('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
  res.json({ scholarship });
}));

router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
  res.json({ message: 'Scholarship deleted' });
}));

module.exports = router;