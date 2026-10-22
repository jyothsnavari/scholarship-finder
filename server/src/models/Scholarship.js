const mongoose = require('mongoose');
const { CATEGORIES, GENDERS } = require('../utils/lists');

const scholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    amount: { type: Number, required: true, min: 0 },
    // Students whose family income is <= this value are eligible
    maxFamilyIncome: { type: Number, required: true, min: 0, index: true },
    deadline: { type: Date, required: true },
    applyLink: { type: String, trim: true, default: '' },

    // Optional extra criteria. An empty list means "open to everyone".
    categories: { type: [{ type: String, enum: CATEGORIES }], default: [] },
    genders: { type: [{ type: String, enum: GENDERS }], default: [] },
    courses: { type: [String], default: [] },
    states: { type: [String], default: [] },
    years: { type: [{ type: Number, min: 1, max: 10 }], default: [] },
    minMarks: { type: Number, min: 0, max: 100 },

    applyClicks: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scholarship', scholarshipSchema);