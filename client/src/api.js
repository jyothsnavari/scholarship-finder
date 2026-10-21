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
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Change the currency here (e.g. 'USD', 'INR') and the locale to match
const CURRENCY = 'INR';
const LOCALE = 'en-IN';
export const money = (n) =>
  new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(n);
export const formatDate = (d) =>
  new Date(d).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
