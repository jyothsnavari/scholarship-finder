const mongoose = require('mongoose');

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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scholarship', scholarshipSchema);
