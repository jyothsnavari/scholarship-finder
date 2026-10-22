const norm = (v) => String(v ?? '').trim().toLowerCase();
const has = (arr) => Array.isArray(arr) && arr.length > 0;
const inList = (arr, v) => arr.some((a) => norm(a) === norm(v));

const TEXT_CHECKS = [
  ['category', 'categories', 'Category'],
  ['gender', 'genders', 'Gender'],
  ['course', 'courses', 'Course'],
  ['state', 'states', 'State'],
];

// status: 'match' (nothing fails), 'near' (exactly one close failure), 'none'.
// Profile fields the student has not filled in go to `missing`; they never count as failures.
function evaluate(student, s) {
  const reasons = [];
  const gaps = [];
  const missing = [];

  if (student.familyIncome <= s.maxFamilyIncome) reasons.push('Your family income is within the limit');
  else gaps.push({ field: 'familyIncome', text: 'Your family income is above the limit' });

  for (const [field, listField, label] of TEXT_CHECKS) {
    const list = s[listField];
    if (!has(list)) continue;
    if (!norm(student[field])) missing.push(label);
    else if (inList(list, student[field])) reasons.push(`${label} matches (${student[field]})`);
    else gaps.push({ field, text: `Open to ${label.toLowerCase()}: ${list.join(', ')}` });
  }

  if (has(s.years)) {
    if (student.year == null) missing.push('Year of study');
    else if (s.years.includes(Number(student.year))) reasons.push(`Open to year ${student.year}`);
    else gaps.push({ field: 'year', text: `Open to year of study: ${s.years.join(', ')}` });
  }

  if (s.minMarks != null) {
    if (student.marks == null) missing.push('Marks');
    else if (student.marks >= s.minMarks) reasons.push(`Your marks meet the ${s.minMarks}% minimum`);
    else gaps.push({ field: 'marks', text: `Needs at least ${s.minMarks}% marks` });
  }

  let status = 'none';
  if (gaps.length === 0) status = 'match';
  else if (gaps.length === 1) {
    const g = gaps[0];
    // an income miss only counts as "close" if it is within 25% of the limit
    if (g.field !== 'familyIncome' || student.familyIncome <= s.maxFamilyIncome * 1.25) status = 'near';
  }
  return { status, reasons, gaps, missing };
}

module.exports = { evaluate };