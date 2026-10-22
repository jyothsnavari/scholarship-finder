import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, daysLeft } from '../api';
import { useAuth } from '../AuthContext';
import ScholarshipCard from '../components/ScholarshipCard';

const SORTS = {
  amount: (a, b) => b.scholarship.amount - a.scholarship.amount,
  deadline: (a, b) => new Date(a.scholarship.deadline) - new Date(b.scholarship.deadline),
  title: (a, b) => a.scholarship.title.localeCompare(b.scholarship.title),
};

const EMPTY = {
  matches: 'No open scholarships match your profile right now. Update your details in your profile, or check back after new ones are added.',
  near: 'No close matches right now.',
  saved: 'Nothing saved yet. Use Save on a scholarship to keep it here, and Mark applied once you have submitted.',
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ matches: [], nearMisses: [], tracked: [] });
  const [tab, setTab] = useState('matches');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('amount');
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [rec, tr] = await Promise.all([api('/scholarships/recommended'), api('/scholarships/tracked')]);
      setData({ matches: rec.matches, nearMisses: rec.nearMisses, tracked: tr.items });
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const track = async (id, status) => {
    try {
      await api(`/scholarships/${id}/track`, { method: 'PUT', body: { status } });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const lists = { matches: data.matches, near: data.nearMisses, saved: data.tracked };
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return lists[tab]
      .filter((i) => {
        const s = i.scholarship;
        if (term && !`${s.title} ${s.provider} ${s.description || ''}`.toLowerCase().includes(term)) return false;
        if (closing && daysLeft(s.deadline) > 30) return false;
        return true;
      })
      .sort(SORTS[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tab, q, sort, closing]);

  const incomplete = [user.category, user.gender, user.course, user.year, user.state, user.marks]
    .some((v) => v === undefined || v === null || v === '');
  const tabs = [['matches', 'Matches'], ['near', 'Close matches'], ['saved', 'Saved & applied']];

  return (
    <>
      <section className="panel">
        <h1>Scholarships for you</h1>
        <p className="muted">
          Based on your family income of {money(user.familyIncome)} and your profile.{' '}
          <Link to="/student/profile">Edit your profile</Link>
        </p>
        {incomplete && (
          <p className="hint">Add your category, gender, course, year, state and marks in your profile to see scholarships that need them.</p>
        )}
        <div className="toolbar">
          <label>Search
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, provider or keyword" />
          </label>
          <label>Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="amount">Highest amount</option>
              <option value="deadline">Closing soonest</option>
              <option value="title">Title A to Z</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={closing} onChange={(e) => setClosing(e.target.checked)} />
            Closing within 30 days
          </label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      <div className="tabs" role="tablist" aria-label="Scholarship lists">
        {tabs.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'tab active' : 'tab'} onClick={() => setTab(key)}>
            {label} ({lists[key].length})
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {loading ? (
          <p className="muted">Finding matches…</p>
        ) : shown.length === 0 ? (
          <p className="empty">{lists[tab].length === 0 ? EMPTY[tab] : 'Nothing matches your search or filters. Clear them to see everything in this list.'}</p>
        ) : (
          <div className="grid">
            {shown.map((item) => (
              <ScholarshipCard key={item.scholarship._id} item={item} income={user.familyIncome} onTrack={track} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
