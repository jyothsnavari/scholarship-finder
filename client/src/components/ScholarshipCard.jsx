import { Link } from 'react-router-dom';
import { api, money, formatDate, daysLeft } from '../api';

export default function ScholarshipCard({ item, income, onTrack }) {
  const s = item.scholarship;
  const left = daysLeft(s.deadline);
  const closed = left < 0;
  const pct = Math.min(100, Math.round((income / s.maxFamilyIncome) * 100)) || 0;
  const badge = closed ? 'Closed' : left === 0 ? 'Closes today' : `${left} day${left === 1 ? '' : 's'} left`;
  const badgeClass = closed ? 'bad' : left <= 7 ? 'warn' : '';
  const reasons = item.reasons || [];
  const gaps = item.gaps || [];
  const missing = item.missing || [];

  const countClick = () => { api(`/scholarships/${s._id}/click`, { method: 'POST' }).catch(() => {}); };

  return (
    <article className="card">
      <p className="amount">{money(s.amount)}</p>
      <h2>{s.title}</h2>
      <p className="muted">{s.provider}</p>
      <p>
        <span className={`badge ${badgeClass}`}>{badge}</span>{' '}
        <span className="muted small">Apply by {formatDate(s.deadline)}</span>
      </p>
      {s.description && <p>{s.description}</p>}

      {reasons.length > 0 && (
        <ul className="reasons" aria-label="Why this matches">
          {reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}
      {gaps.length > 0 && (
        <div className="gaps" role="note">
          <strong>Why it is a close match, not a full match</strong>
          <ul>{gaps.map((g) => <li key={g.text}>{g.text}</li>)}</ul>
        </div>
      )}
      {missing.length > 0 && (
        <p className="hint">
          Add your {missing.map((m) => m.toLowerCase()).join(', ')} in your <Link to="/student/profile">profile</Link> to confirm you qualify.
        </p>
      )}

      <div className="meter" role="img" aria-label={`Your income is ${pct}% of the ${money(s.maxFamilyIncome)} limit`}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="muted small">Your income {money(income)} of {money(s.maxFamilyIncome)} limit</p>

      <div className="actions-row">
        {s.applyLink && !closed && (
          <a className="btn" href={s.applyLink} target="_blank" rel="noreferrer" onClick={countClick}>Apply now</a>
        )}
        <button
          className="btn ghost"
          aria-pressed={item.tracked === 'saved'}
          disabled={item.tracked === 'applied'}
          onClick={() => onTrack(s._id, item.tracked === 'saved' ? 'none' : 'saved')}
        >
          {item.tracked === 'saved' ? 'Saved ✓' : 'Save'}
        </button>
        <button
          className="btn ghost"
          aria-pressed={item.tracked === 'applied'}
          onClick={() => onTrack(s._id, item.tracked === 'applied' ? 'none' : 'applied')}
        >
          {item.tracked === 'applied' ? 'Applied ✓' : 'Mark applied'}
        </button>
      </div>
    </article>
  );
}