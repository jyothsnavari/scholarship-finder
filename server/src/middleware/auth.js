const jwt = require('jsonwebtoken');
const User = require('../models/User');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in to continue' });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }
  const user = await User.findById(payload.id);
  if (!user) return res.status(401).json({ message: 'Account no longer exists' });
  req.user = user;
  next();
});

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: 'You do not have access to this action' });

module.exports = { asyncHandler, authenticate, requireRole };
