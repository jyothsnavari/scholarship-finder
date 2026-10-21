import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Login, Register } from './pages/Auth';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

const home = (user) => (user ? (user.role === 'admin' ? '/admin' : '/student') : '/login');

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={home(user)} replace />;
  return children;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  return user ? <Navigate to={home(user)} replace /> : children;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Scholarship Finder</Link>
        {user && (
          <div className="who">
            <span>{user.name} ({user.role})</span>
            <button className="btn ghost" onClick={logout}>Log out</button>
          </div>
        )}
      </header>
      <main className="container">
        <Routes>
          <Route path="/login" element={<Guest><Login /></Guest>} />
          <Route path="/register" element={<Guest><Register /></Guest>} />
          <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
          <Route path="*" element={<Navigate to={home(user)} replace />} />
        </Routes>
      </main>
    </>
  );
}
