import { useEffect, useState } from 'react';
import { api, money, formatDate } from '../api';

const empty = { title: '', provider: '', description: '', amount: '', maxFamilyIncome: '', deadline: '', applyLink: '' };

export default function AdminDashboard() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => api('/scholarships').then((d) => setList(d.scholarships)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice('');
    try {
      const body = { ...form, amount: Number(form.amount), maxFamilyIncome: Number(form.maxFamilyIncome) };
      if (editingId) await api(`/scholarships/${editingId}`, { method: 'PUT', body });
      else await api('/scholarships', { method: 'POST', body });
      setNotice(editingId ? 'Scholarship saved.' : 'Scholarship added.');
      setForm(empty); setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (s) => {
    setEditingId(s._id);
    setForm({
      title: s.title, provider: s.provider, description: s.description || '',
      amount: s.amount, maxFamilyIncome: s.maxFamilyIncome,
      deadline: s.deadline.slice(0, 10), applyLink: s.applyLink || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.title}"?`)) return;
    try { await api(`/scholarships/${s._id}`, { method: 'DELETE' }); load(); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <form className="panel" onSubmit={submit}>
        <h1>{editingId ? 'Edit scholarship' : 'Add a scholarship'}</h1>
        <div className="form-grid">
          <label>Title<input value={form.title} onChange={set('title')} required /></label>
          <label>Provider<input value={form.provider} onChange={set('provider')} required /></label>
          <label>Award amount<input type="number" min="0" value={form.amount} onChange={set('amount')} required /></label>
          <label>Maximum family income
            <input type="number" min="0" value={form.maxFamilyIncome} onChange={set('maxFamilyIncome')} required />
            <small className="muted">Students at or below this income will see it.</small>
          </label>
          <label>Deadline<input type="date" value={form.deadline} onChange={set('deadline')} required /></label>
          <label>Application link<input type="url" value={form.applyLink} onChange={set('applyLink')} placeholder="https://" /></label>
        </div>
        <label>Description<textarea rows="3" value={form.description} onChange={set('description')} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="ok">{notice}</p>}
        <div className="row">
          <button className="btn">{editingId ? 'Save changes' : 'Add scholarship'}</button>
          {editingId && <button type="button" className="btn ghost" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
        </div>
      </form>

      <section className="panel">
        <h2>All scholarships ({list.length})</h2>
        {list.length === 0 ? (
          <p className="empty">No scholarships yet. Add the first one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Provider</th><th>Amount</th><th>Income limit</th><th>Deadline</th><th></th></tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s._id}>
                    <td>{s.title}</td>
                    <td>{s.provider}</td>
                    <td>{money(s.amount)}</td>
                    <td>{money(s.maxFamilyIncome)}</td>
                    <td>{formatDate(s.deadline)}</td>
                    <td className="actions">
                      <button className="btn ghost" onClick={() => edit(s)}>Edit</button>
                      <button className="btn danger" onClick={() => remove(s)}>Delete</button>
                    </td>
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
