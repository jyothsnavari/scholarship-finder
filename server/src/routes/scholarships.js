const express = require('express');
const Scholarship = require('../models/Scholarship');
const { asyncHandler, authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Student: scholarships whose income limit is at or above the student's family income,
// and whose deadline has not passed. Highest amount first.
router.get('/recommended', requireRole('student'), asyncHandler(async (req, res) => {
  const scholarships = await Scholarship.find({
    maxFamilyIncome: { $gte: req.user.familyIncome },
    deadline: { $gte: startOfToday() },
  }).sort({ amount: -1, deadline: 1 });
  res.json({ scholarships });
}));

// Admin: all scholarships
router.get('/', requireRole('admin'), asyncHandler(async (req, res) => {
  res.json({ scholarships: await Scholarship.find().sort({ createdAt: -1 }) });
}));

const pick = (body) => {
  const { title, provider, description, amount, maxFamilyIncome, deadline, applyLink } = body;
  return { title, provider, description, amount, maxFamilyIncome, deadline, applyLink };
};

router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.create({ ...pick(req.body), createdBy: req.user._id });
  res.status(201).json({ scholarship });
}));

router.put('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.findByIdAndUpdate(req.params.id, pick(req.body), {
    new: true, runValidators: true,
  });
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
  res.json({ scholarship });
}));

router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
  res.json({ message: 'Scholarship deleted' });
}));

module.exports = router;
