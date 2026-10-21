import { useEffect, useState } from 'react';
import { api, money, formatDate } from '../api';
import { useAuth } from '../AuthContext';

export default function StudentDashboard() {
  const { user, setUser } = useAuth();
  const [items, setItems] = useState([]);
  const [income, setIncome] = useState(user.familyIncome);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    api('/scholarships/recommended')
      .then((d) => setItems(d.scholarships))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const saveIncome = async (e) => {
    e.preventDefault();
    setError(''); setNotice('');
    try {
      const d = await api('/auth/me', { method: 'PATCH', body: { familyIncome: Number(income) } });
      setUser(d.user);
      setNotice('Income updated. Your matches have been refreshed.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <section className="panel">
        <h1>Scholarships you qualify for</h1>
        <p className="muted">
          You see a scholarship when your family income is at or below its limit.
        </p>
        <form className="inline" onSubmit={saveIncome}>
          <label>Annual family income
            <input type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)} required />
          </label>
          <button className="btn">Update income</button>
        </form>
        {notice && <p className="ok">{notice}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {loading ? (
        <p className="muted">Finding matches…</p>
      ) : items.length === 0 ? (
        <p className="empty">No open scholarships match an income of {money(user.familyIncome)} right now. Check back after new ones are added, or update your income above if it has changed.</p>
      ) : (
        <div className="grid">
          {items.map((s) => {
            const pct = Math.min(100, Math.round((user.familyIncome / s.maxFamilyIncome) * 100)) || 0;
            return (
              <article className="card" key={s._id}>
                <p className="amount">{money(s.amount)}</p>
                <h2>{s.title}</h2>
                <p className="muted">{s.provider} · Apply by {formatDate(s.deadline)}</p>
                {s.description && <p>{s.description}</p>}
                <div className="meter" role="img" aria-label={`Your income is ${pct}% of the ${money(s.maxFamilyIncome)} limit`}>
                  <span style={{ width: `${pct}%` }} />
                </div>
                <p className="muted small">Your income {money(user.familyIncome)} of {money(s.maxFamilyIncome)} limit</p>
                {s.applyLink && (
                  <a className="btn" href={s.applyLink} target="_blank" rel="noreferrer">Apply now</a>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
