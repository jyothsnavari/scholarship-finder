import { useEffect, useState } from 'react';
import { api, money, formatDate } from '../api';

export default function AdminInsights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/admin/stats').then(setData).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="error" role="alert">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  const { totals, scholarships } = data;

  return (
    <>
      <section className="panel">
        <h1>Insights</h1>
        <div className="stats">
          <div><strong>{totals.students}</strong><span>Students</span></div>
          <div><strong>{totals.active}</strong><span>Open scholarships</span></div>
          <div><strong>{totals.expired}</strong><span>Closed scholarships</span></div>
        </div>
      </section>
      <section className="panel">
        <h2>How each scholarship is doing</h2>
        <p className="muted small">"Match" counts students who fully qualify today. Clicks count taps on Apply now.</p>
        {scholarships.length === 0 ? <p className="empty">Add a scholarship to see numbers here.</p> : (
          <div className="table-wrap">
            <table className="stack">
              <thead><tr><th>Scholarship</th><th>Amount</th><th>Deadline</th><th>Students who match</th><th>Saved</th><th>Applied</th><th>Apply clicks</th></tr></thead>
              <tbody>
                {scholarships.map((s) => (
                  <tr key={s.id}>
                    <td data-label="Scholarship">{s.title} <span className="muted small">({s.provider})</span></td>
                    <td data-label="Amount">{money(s.amount)}</td>
                    <td data-label="Deadline">{formatDate(s.deadline)} {s.expired && <span className="badge bad">Closed</span>}</td>
                    <td data-label="Match">{s.matched}</td>
                    <td data-label="Saved">{s.saved}</td>
                    <td data-label="Applied">{s.applied}</td>
                    <td data-label="Apply clicks">{s.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}