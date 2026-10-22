import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { CATEGORIES, GENDERS } from '../constants';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    familyIncome: user.familyIncome ?? '',
    category: user.category || '',
    gender: user.gender || '',
    course: user.course || '',
    year: user.year ?? '',
    state: user.state || '',
    marks: user.marks ?? '',
  });
  const [opts, setOpts] = useState({ courses: [], states: [] });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/scholarships/options').then(setOpts).catch(() => {}); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      const d = await api('/auth/me', { method: 'PATCH', body: form });
      setUser(d.user);
      setNotice('Profile saved. Your matches are updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel" onSubmit={submit}>
      <h1>My profile</h1>
      <p className="muted">Scholarships use these details to decide whether you qualify. Anything you leave blank is simply not checked.</p>
      <div className="form-grid">
        <label>Full name<input value={form.name} onChange={set('name')} required /></label>
        <label>Email<input value={user.email} disabled /></label>
        <label>Annual family income<input type="number" min="0" value={form.familyIncome} onChange={set('familyIncome')} required /></label>
        <label>Category
          <select value={form.category} onChange={set('category')}>
            <option value="">Not set</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Gender
          <select value={form.gender} onChange={set('gender')}>
            <option value="">Not set</option>
            {GENDERS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
        <label>Course or field of study
          <input list="course-options" value={form.course} onChange={set('course')} placeholder="e.g. Engineering" />
          <datalist id="course-options">{opts.courses.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label>Year of study
          <input type="number" min="1" max="10" value={form.year} onChange={set('year')} />
        </label>
        <label>State
          <input list="state-options" value={form.state} onChange={set('state')} />
          <datalist id="state-options">{opts.states.map((s) => <option key={s} value={s} />)}</datalist>
        </label>
        <label>Marks (percent)
          <input type="number" min="0" max="100" step="0.1" value={form.marks} onChange={set('marks')} />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {notice && <p className="ok" role="status">{notice}</p>}
      <div className="row"><button className="btn" disabled={busy}>Save profile</button></div>
    </form>
  );
}