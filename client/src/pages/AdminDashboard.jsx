import { useEffect, useState } from 'react';
import { api, money, formatDate, daysLeft, saveBlob } from '../api';
import { CATEGORIES, GENDERS } from '../constants';
import { parseCSV, TEMPLATE } from '../csv';

const empty = {
  title: '', provider: '', description: '', amount: '', maxFamilyIncome: '', deadline: '', applyLink: '',
  categories: [], genders: [], courses: '', states: '', years: '', minMarks: '',
};

function CheckGroup({ legend, options, value, onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <fieldset className="checks">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o} className="check">
          <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />
          {o}
        </label>
      ))}
    </fieldset>
  );
}

const criteriaText = (s) =>
  [
    s.categories?.length && `Category: ${s.categories.join(', ')}`,
    s.genders?.length && `Gender: ${s.genders.join(', ')}`,
    s.courses?.length && `Course: ${s.courses.join(', ')}`,
    s.states?.length && `State: ${s.states.join(', ')}`,
    s.years?.length && `Year: ${s.years.join(', ')}`,
    s.minMarks != null && `Marks: ${s.minMarks}%+`,
  ].filter(Boolean).join(' · ') || 'Open to all';

export default function AdminDashboard() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState('active');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rows, setRows] = useState(null);
  const [result, setResult] = useState(null);

  const load = () => api('/scholarships').then((d) => setList(d.scholarships)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setVal = (k) => (v) => setForm({ ...form, [k]: v });

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
      categories: s.categories || [], genders: s.genders || [],
      courses: (s.courses || []).join(', '), states: (s.states || []).join(', '),
      years: (s.years || []).join(', '), minMarks: s.minMarks ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.title}"?`)) return;
    try { await api(`/scholarships/${s._id}`, { method: 'DELETE' }); load(); }
    catch (err) { setError(err.message); }
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setResult(null); setError('');
    setRows(parseCSV(await file.text()));
  };

  const upload = async () => {
    try {
      const d = await api('/scholarships/bulk', { method: 'POST', body: { rows } });
      setResult(d); setRows(null); load();
    } catch (err) { setError(err.message); }
  };

  const expired = (s) => daysLeft(s.deadline) < 0;
  const visible = list.filter((s) => (view === 'all' ? true : view === 'expired' ? expired(s) : !expired(s)));
  const counts = { active: list.filter((s) => !expired(s)).length, expired: list.filter(expired).length, all: list.length };

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
            <small className="muted">Students at or below this income qualify.</small>
          </label>
          <label>Deadline<input type="date" value={form.deadline} onChange={set('deadline')} required /></label>
          <label>Application link<input type="url" value={form.applyLink} onChange={set('applyLink')} placeholder="https://" /></label>
        </div>
        <label>Description<textarea rows="3" value={form.description} onChange={set('description')} /></label>

        <h2>Extra eligibility (optional)</h2>
        <p className="muted small">Leave a field empty to keep the scholarship open to everyone on that point.</p>
        <div className="form-grid">
          <CheckGroup legend="Categories" options={CATEGORIES} value={form.categories} onChange={setVal('categories')} />
          <CheckGroup legend="Gender" options={GENDERS} value={form.genders} onChange={setVal('genders')} />
          <label>Courses<input value={form.courses} onChange={set('courses')} placeholder="Engineering, Medicine" /></label>
          <label>States<input value={form.states} onChange={set('states')} placeholder="Telangana, Karnataka" /></label>
          <label>Years of study<input value={form.years} onChange={set('years')} placeholder="1, 2" /></label>
          <label>Minimum marks (percent)<input type="number" min="0" max="100" value={form.minMarks} onChange={set('minMarks')} /></label>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="ok" role="status">{notice}</p>}
        <div className="row">
          <button className="btn">{editingId ? 'Save changes' : 'Add scholarship'}</button>
          {editingId && <button type="button" className="btn ghost" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
        </div>
      </form>

      <section className="panel">
        <h2>Add many at once</h2>
        <p className="muted">Upload a CSV file. Separate several values in one cell with a vertical bar, like SC|ST.</p>
        <div className="row wrap">
          <button type="button" className="btn ghost" onClick={() => saveBlob(new Blob([TEMPLATE], { type: 'text/csv' }), 'scholarships-template.csv')}>Download template</button>
          <label className="btn ghost filebtn">Choose CSV file
            <input type="file" accept=".csv,text/csv" onChange={onFile} />
          </label>
        </div>
        {rows && (
          <div className="row wrap">
            <p>{rows.length} row{rows.length === 1 ? '' : 's'} ready to upload.</p>
            <button type="button" className="btn" disabled={!rows.length} onClick={upload}>Upload {rows.length} scholarship{rows.length === 1 ? '' : 's'}</button>
            <button type="button" className="btn ghost" onClick={() => setRows(null)}>Cancel</button>
          </div>
        )}
        {result && (
          <div role="status">
            <p className="ok">{result.inserted} scholarship{result.inserted === 1 ? '' : 's'} added.</p>
            {result.errors.length > 0 && (
              <>
                <p className="error">{result.errors.length} row{result.errors.length === 1 ? '' : 's'} skipped:</p>
                <ul>{result.errors.map((e) => <li key={e.row}>Row {e.row}: {e.message}</li>)}</ul>
              </>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Scholarships</h2>
        <div className="tabs" role="tablist" aria-label="Scholarship status">
          {[['active', 'Open'], ['expired', 'Closed'], ['all', 'All']].map(([key, label]) => (
            <button key={key} role="tab" aria-selected={view === key} className={view === key ? 'tab active' : 'tab'} onClick={() => setView(key)}>
              {label} ({counts[key]})
            </button>
          ))}
        </div>
        {visible.length === 0 ? (
          <p className="empty">{view === 'expired' ? 'No closed scholarships yet.' : 'No scholarships here yet. Add the first one above.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="stack">
              <thead>
                <tr><th>Title</th><th>Provider</th><th>Amount</th><th>Income limit</th><th>Other criteria</th><th>Deadline</th><th>Clicks</th><th></th></tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s._id}>
                    <td data-label="Title">{s.title}</td>
                    <td data-label="Provider">{s.provider}</td>
                    <td data-label="Amount">{money(s.amount)}</td>
                    <td data-label="Income limit">{money(s.maxFamilyIncome)}</td>
                    <td data-label="Other criteria" className="small">{criteriaText(s)}</td>
                    <td data-label="Deadline">{formatDate(s.deadline)} {expired(s) && <span className="badge bad">Closed</span>}</td>
                    <td data-label="Clicks">{s.applyClicks || 0}</td>
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
