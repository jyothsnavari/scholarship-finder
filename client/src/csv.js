// Small CSV reader: handles quoted fields, escaped quotes and line breaks inside quotes.
export function parseCSV(text) {
  const s = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i += 1;
      row.push(field); field = ''; rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }

  const filled = rows.filter((r) => r.some((x) => x.trim() !== ''));
  if (!filled.length) return [];
  const keys = filled[0].map((h) => h.trim());
  return filled.slice(1).map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

export const TEMPLATE = [
  'title,provider,description,amount,maxFamilyIncome,deadline,applyLink,categories,genders,courses,states,years,minMarks',
  'Sample Grant,Example Trust,"Short description, with a comma",50000,300000,2027-03-31,https://example.com/apply,SC|ST,,Engineering|Medicine,Telangana,1|2,60',
].join('\n');