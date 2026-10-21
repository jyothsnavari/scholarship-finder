const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role, familyIncome: u.familyIncome,
});

const parseIncome = (value) => {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(n) || n < 0) {
    const err = new Error('Family income must be a number, 0 or higher');
    err.status = 400;
    throw err;
  }
  return n;
};

// Public sign-up always creates a student. Admins are created via `npm run seed`.
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, familyIncome } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }
  const user = await User.create({
    name, email, password, role: 'student', familyIncome: parseIncome(familyIncome),
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

// Students can update their family income; recommendations follow automatically
router.patch('/me', authenticate, requireRole('student'), asyncHandler(async (req, res) => {
  req.user.familyIncome = parseIncome(req.body.familyIncome);
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}));

module.exports = router;
