const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.code = data.code;
    throw err;
  }
  return data;
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function download(path, filename) {
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  if (!res.ok) throw new Error('Download failed');
  saveBlob(await res.blob(), filename);
}

// Change the currency here (e.g. 'USD', 'INR') and the locale to match
const CURRENCY = 'INR';
const LOCALE = 'en-IN';
export const money = (n) =>
  new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(n);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Whole days until the end of the deadline day (negative once it has passed)
export const daysLeft = (d) => {
  const dt = new Date(d);
  const end = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 23, 59, 59);
  const now = new Date();
  const todayEnd = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return Math.round((end - todayEnd) / 86400000);
};