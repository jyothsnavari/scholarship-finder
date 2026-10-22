import { useEffect, useState } from 'react';
import { api, download, money, formatDate } from '../api';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/admin/students').then((d) => setStudents(d.students)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const term = q.trim().toLowerCase();
  const shown = students.filter((s) => !term || `${s.name} ${s.email} ${s.course} ${s.state}`.toLowerCase().includes(term));

  const exportCsv = async () => {
    try { await download('/admin/students.csv', 'students.csv'); }
    catch (e) { setError(e.message); }
  };

  return (
    <section className="panel">
      <h1>Students ({students.length})</h1>
      <div className="toolbar">
        <label>Search
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, course or state" />
        </label>
        <button className="btn ghost" onClick={exportCsv}>Export CSV</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : shown.length === 0 ? (
        <p className="empty">{students.length ? 'No students match your search.' : 'No students have registered yet.'}</p>
      ) : (
        <div className="table-wrap">
          <table className="stack">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Family income</th><th>Category</th><th>Course</th><th>State</th><th>Saved</th><th>Applied</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td data-label="Name">{s.name} {!s.emailVerified && <span className="badge warn">Unverified</span>}</td>
                  <td data-label="Email">{s.email}</td>
                  <td data-label="Family income">{money(s.familyIncome)}</td>
                  <td data-label="Category">{s.category || '-'}</td>
                  <td data-label="Course">{s.course || '-'}</td>
                  <td data-label="State">{s.state || '-'}</td>
                  <td data-label="Saved">{s.saved}</td>
                  <td data-label="Applied">{s.applied}</td>
                  <td data-label="Joined">{formatDate(s.joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}