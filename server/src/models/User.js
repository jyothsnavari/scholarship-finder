const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { CATEGORIES, GENDERS } = require('../utils/lists');

const trackedSchema = new mongoose.Schema(
  {
    scholarship: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship', required: true },
    status: { type: String, enum: ['saved', 'applied'], required: true },
    remindedAt: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'student'], default: 'student' },

    // Profile used for matching (students)
    familyIncome: { type: Number, min: 0, required: function () { return this.role === 'student'; } },
    category: { type: String, enum: CATEGORIES },
    gender: { type: String, enum: GENDERS },
    course: { type: String, trim: true },
    year: { type: Number, min: 1, max: 10 },
    state: { type: String, trim: true },
    marks: { type: Number, min: 0, max: 100 },

    // Saved / applied scholarships
    tracked: { type: [trackedSchema], default: [] },

    // Email verification and password reset
    emailVerified: { type: Boolean, default: true },
    verifyTokenHash: { type: String, select: false },
    verifyExpires: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);