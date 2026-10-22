import { Navigate, NavLink, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Login, Register, ForgotPassword, ResetPassword, VerifyEmail } from './pages/Auth';
import StudentDashboard from './pages/StudentDashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './pages/AdminStudents';
import AdminInsights from './pages/AdminInsights';
import AdminTeam from './pages/AdminTeam';

const home = (user) => (user ? (user.role === 'admin' ? '/admin' : '/student') : '/login');

const NAV = {
  student: [['/student', 'Scholarships'], ['/student/profile', 'My profile']],
  admin: [['/admin', 'Scholarships'], ['/admin/students', 'Students'], ['/admin/insights', 'Insights'], ['/admin/team', 'Team']],
};

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
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to="/" className="brand">Scholarship Finder</Link>
        {user && (
          <>
            <nav aria-label="Main" className="mainnav">
              {NAV[user.role].map(([to, label]) => (
                <NavLink key={to} to={to} end>{label}</NavLink>
              ))}
            </nav>
            <div className="who">
              <span>{user.name}</span>
              <button className="btn ghost" onClick={logout}>Log out</button>
            </div>
          </>
        )}
      </header>
      <main id="main" className="container">
        <Routes>
          <Route path="/login" element={<Guest><Login /></Guest>} />
          <Route path="/register" element={<Guest><Register /></Guest>} />
          <Route path="/forgot-password" element={<Guest><ForgotPassword /></Guest>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
          <Route path="/student/profile" element={<Protected role="student"><Profile /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
          <Route path="/admin/students" element={<Protected role="admin"><AdminStudents /></Protected>} />
          <Route path="/admin/insights" element={<Protected role="admin"><AdminInsights /></Protected>} />
          <Route path="/admin/team" element={<Protected role="admin"><AdminTeam /></Protected>} />
          <Route path="*" element={<Navigate to={home(user)} replace />} />
        </Routes>
      </main>
    </>
  );
}
