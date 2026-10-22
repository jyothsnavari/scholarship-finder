const nodemailer = require('nodemailer');

const mailConfigured = () => Boolean(process.env.SMTP_HOST);

let transporter;
function getTransport() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

// Returns true when an email was actually sent. Never throws.
async function sendMail({ to, subject, text }) {
  if (!mailConfigured()) {
    console.log(`\n[email not configured] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return false;
  }
  try {
    await getTransport().sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
    return true;
  } catch (e) {
    console.error('Email failed:', e.message);
    return false;
  }
}

module.exports = { sendMail, mailConfigured };