const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, authenticate, requireRole } = require('../middleware/auth');
const { sendMail, mailConfigured } = require('../utils/mail');
const { newToken, hash } = require('../utils/tokens');

const router = express.Router();
const CLIENT_URL = () => process.env.CLIENT_URL || 'http://localhost:5173';

const bad = (message, status = 400) => Object.assign(new Error(message), { status });

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  familyIncome: u.familyIncome,
  category: u.category,
  gender: u.gender,
  course: u.course,
  year: u.year,
  state: u.state,
  marks: u.marks,
  emailVerified: u.emailVerified !== false,
});

const num = (value, label, min, max) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  if (Number.isNaN(n) || n < min || n > max) throw bad(`${label} must be a number between ${min} and ${max}`);
  return n;
};
const parseIncome = (value) => {
  const n = num(value, 'Family income', 0, Number.MAX_SAFE_INTEGER);
  if (n === undefined) throw bad('Family income must be a number, 0 or higher');
  return n;
};

async function issueVerification(user) {
  const token = newToken();
  user.verifyTokenHash = hash(token);
  user.verifyExpires = new Date(Date.now() + 24 * 3600 * 1000);
  await user.save();
  await sendMail({
    to: user.email,
    subject: 'Verify your email for Scholarship Finder',
    text: `Hi ${user.name},\n\nConfirm your email to start finding scholarships:\n${CLIENT_URL()}/verify-email?token=${token}\n\nThis link expires in 24 hours.`,
  });
}

// Public sign-up always creates a student. Admins are created via `npm run seed` or by another admin.
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, familyIncome } = req.body;
  if (!name || !email || !password) throw bad('Name, email and password are required');
  if (password.length < 6) throw bad('Password must be at least 6 characters');
  if (await User.findOne({ email: email.toLowerCase() })) throw bad('An account with this email already exists', 409);

  const needsVerification = mailConfigured();
  const user = await User.create({
    name, email, password, role: 'student',
    familyIncome: parseIncome(familyIncome),
    emailVerified: !needsVerification,
  });
  if (needsVerification) {
    await issueVerification(user);
    return res.status(201).json({ needsVerification: true, message: `We sent a verification link to ${user.email}. Open it to activate your account.` });
  }
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) throw bad('Incorrect email or password', 401);
  if (user.emailVerified === false) {
    return res.status(403).json({ message: 'Please verify your email first. Check your inbox for the link.', code: 'UNVERIFIED' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/verify-email', asyncHandler(async (req, res) => {
  const user = await User.findOne({
    verifyTokenHash: hash(req.body.token || ''),
    verifyExpires: { $gt: new Date() },
  });
  if (!user) throw bad('This verification link is invalid or has expired. Request a new one from the login page.');
  user.emailVerified = true;
  user.verifyTokenHash = undefined;
  user.verifyExpires = undefined;
  await user.save();
  res.json({ message: 'Email verified. You can log in now.' });
}));

router.post('/resend-verification', asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (user && user.emailVerified === false && mailConfigured()) await issueVerification(user);
  res.json({ message: 'If that account needs verification, a new email is on its way.' });
}));

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (user) {
    const token = newToken();
    user.resetTokenHash = hash(token);
    user.resetExpires = new Date(Date.now() + 3600 * 1000);
    await user.save();
    await sendMail({
      to: user.email,
      subject: 'Reset your Scholarship Finder password',
      text: `Hi ${user.name},\n\nReset your password using this link (valid for 1 hour):\n${CLIENT_URL()}/reset-password?token=${token}\n\nIf you did not ask for this, you can ignore this email.`,
    });
  }
  res.json({ message: 'If an account exists for that email, a reset link is on its way.' });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!password || password.length < 6) throw bad('Password must be at least 6 characters');
  const user = await User.findOne({ resetTokenHash: hash(token || ''), resetExpires: { $gt: new Date() } });
  if (!user) throw bad('This reset link is invalid or has expired. Request a new one.');
  user.password = password;
  user.resetTokenHash = undefined;
  user.resetExpires = undefined;
  user.emailVerified = true; // receiving the reset email proves ownership
  await user.save();
  res.json({ message: 'Password updated. You can log in now.' });
}));

router.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

// Students edit their profile; recommendations follow automatically
router.patch('/me', authenticate, requireRole('student'), asyncHandler(async (req, res) => {
  const b = req.body;
  const u = req.user;
  const text = (field, v) => { if (v !== undefined) u[field] = v === '' || v === null ? undefined : v; };

  if (b.name !== undefined) {
    if (!String(b.name).trim()) throw bad('Name cannot be empty');
    u.name = b.name;
  }
  if (b.familyIncome !== undefined) u.familyIncome = parseIncome(b.familyIncome);
  text('category', b.category);
  text('gender', b.gender);
  text('course', b.course);
  text('state', b.state);
  if (b.year !== undefined) u.year = num(b.year, 'Year of study', 1, 10);
  if (b.marks !== undefined) u.marks = num(b.marks, 'Marks', 0, 100);

  await u.save();
  res.json({ user: publicUser(u) });
}));

module.exports = router;
