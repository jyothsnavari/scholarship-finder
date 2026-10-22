const User = require('../models/User');
const Scholarship = require('../models/Scholarship');
const { sendMail, mailConfigured } = require('./mail');

// Emails each student once about saved scholarships closing within 7 days.
async function sendDeadlineReminders() {
  if (!mailConfigured()) return { sent: 0, skipped: 'email is not configured' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soon = new Date(today.getTime() + 7 * 86400000 + 86399999);

  const students = await User.find({ role: 'student', 'tracked.status': 'saved' });
  let sent = 0;

  for (const st of students) {
    if (st.emailVerified === false) continue;
    const pending = st.tracked.filter((t) => t.status === 'saved' && !t.remindedAt);
    if (!pending.length) continue;

    const list = await Scholarship.find({
      _id: { $in: pending.map((t) => t.scholarship) },
      deadline: { $gte: today, $lte: soon },
    }).lean();
    if (!list.length) continue;

    const lines = list
      .map((s) => `- ${s.title} (${s.provider}) closes on ${new Date(s.deadline).toUTCString().slice(0, 16)}${s.applyLink ? `\n  Apply: ${s.applyLink}` : ''}`)
      .join('\n');
    const ok = await sendMail({
      to: st.email,
      subject: 'Scholarships you saved are closing soon',
      text: `Hi ${st.name},\n\nThese scholarships you saved close within a week:\n\n${lines}\n\nLog in to mark them as applied once you have submitted.`,
    });
    if (ok) {
      const ids = new Set(list.map((s) => String(s._id)));
      st.tracked.forEach((t) => { if (ids.has(String(t.scholarship))) t.remindedAt = new Date(); });
      await st.save();
      sent += 1;
    }
  }
  return { sent };
}

module.exports = { sendDeadlineReminders };