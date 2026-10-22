import { useEffect, useState } from 'react';
import { api, formatDate } from '../api';

export default function AdminTeam() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () => api('/admin/admins').then((d) => setAdmins(d.admins)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice('');
    try {
      const d = await api('/admin/admins', { method: 'POST', body: form });
      setNotice(`${d.admin.email} is now an admin.`);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <form className="panel" onSubmit={submit}>
        <h1>Add an admin</h1>
        <p className="muted">Admins can manage scholarships and see student data. Share the password with them securely and ask them to keep it private.</p>
        <div className="form-grid">
          <label>Full name<input value={form.name} onChange={set('name')} required /></label>
          <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
          <label>Temporary password<input type="password" minLength={6} value={form.password} onChange={set('password')} autoComplete="new-password" required /></label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="ok" role="status">{notice}</p>}
        <div className="row"><button className="btn">Add admin</button></div>
      </form>
      <section className="panel">
        <h2>Current admins ({admins.length})</h2>
        <ul className="plain">
          {admins.map((a) => <li key={a.id}>{a.name} <span className="muted">({a.email}), since {formatDate(a.joined)}</span></li>)}
        </ul>
      </section>
    </>
  );
}