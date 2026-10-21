require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Scholarship = require('./models/Scholarship');

const inDays = (n) => new Date(Date.now() + n * 86400000);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  if (!(await User.findOne({ email }))) {
    await User.create({ name: 'Admin', email, password: process.env.ADMIN_PASSWORD || 'Admin@12345', role: 'admin' });
    console.log(`Admin created: ${email}`);
  } else {
    console.log('Admin already exists');
  }

  if ((await Scholarship.countDocuments()) === 0) {
    await Scholarship.insertMany([
      { title: 'First-Generation Learner Grant', provider: 'Education Trust', description: 'For students who are the first in their family to attend college.', amount: 50000, maxFamilyIncome: 250000, deadline: inDays(60), applyLink: 'https://example.com/fgl' },
      { title: 'Merit Plus Scholarship', provider: 'Alumni Foundation', description: 'Supports high-performing students with moderate family income.', amount: 80000, maxFamilyIncome: 600000, deadline: inDays(45), applyLink: 'https://example.com/merit' },
      { title: 'STEM Access Award', provider: 'Tech Futures Fund', description: 'Tuition support for science, technology, engineering and maths students.', amount: 120000, maxFamilyIncome: 800000, deadline: inDays(90), applyLink: 'https://example.com/stem' },
    ]);
    console.log('Sample scholarships added');
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
