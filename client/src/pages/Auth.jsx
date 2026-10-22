import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', familyIncome: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
const [showPw, setShowPw] = useState(false);   // <- add this line
const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isRegister ? await register(form) : await login(form);
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>{isRegister ? 'Create your student account' : 'Log in'}</h1>
      {isRegister && (
        <label>Full name
          <input value={form.name} onChange={set('name')} required />
        </label>
      )}
      <label>Email
        <input type="email" value={form.email} onChange={set('email')} required />
      </label>
      <label>Password
  <div className="pw-field">
    <input type={showPw ? 'text' : 'password'} minLength={6} value={form.password} onChange={set('password')} required />
    <button type="button" className="btn ghost pw-toggle" onClick={() => setShowPw(!showPw)} aria-pressed={showPw}>
      {showPw ? 'Hide' : 'Show'}
    </button>
  </div>
</label>
      {isRegister && (
        <label>Annual family income
          <input type="number" min="0" value={form.familyIncome} onChange={set('familyIncome')} required />
          <small className="muted">Used only to match you with scholarships you qualify for.</small>
        </label>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{isRegister ? 'Create account' : 'Log in'}</button>
      <p className="muted">
        {isRegister ? <>Already registered? <Link to="/login">Log in</Link></> : <>New student? <Link to="/register">Create an account</Link></>}
      </p>
    </form>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
