const crypto = require('crypto');

const newToken = () => crypto.randomBytes(32).toString('hex');
const hash = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');

module.exports = { newToken, hash };