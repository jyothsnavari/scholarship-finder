const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];

const toArray = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[|,;]/) : []);

// Trim, de-duplicate (case-insensitive) and use the standard spelling when given
function cleanList(v, canonical) {
  const out = [];
  for (let item of toArray(v)) {
    item = String(item).trim();
    if (!item) continue;
    const hit = canonical && canonical.find((c) => c.toLowerCase() === item.toLowerCase());
    const val = hit || item;
    if (!out.some((o) => o.toLowerCase() === val.toLowerCase())) out.push(val);
  }
  return out;
}

function cleanNumbers(v) {
  const nums = toArray(v).map((x) => String(x).trim()).filter(Boolean).map(Number).filter(Number.isFinite);
  return [...new Set(nums)];
}

module.exports = { CATEGORIES, GENDERS, cleanList, cleanNumbers };