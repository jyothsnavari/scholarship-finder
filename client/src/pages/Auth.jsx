import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

function PasswordField({ label = 'Password', value, onChange, autoComplete }) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw-field">
        <input id={id} type={show ? 'text' : 'password'} minLength={6} value={value} onChange={onChange} autoComplete={autoComplete} required />
        <button type="button" className="btn ghost pw-toggle" onClick={() => setShow(!show)} aria-pressed={show}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

function Messages({ error, info }) {
  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      {info && <p className="ok" role="status">{info}</p>}
    </>
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setUnverified(false); setBusy(true);
    try {
      const user = await login(form);
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      setError(err.message);
      setUnverified(err.code === 'UNVERIFIED');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      const d = await api('/auth/resend-verification', { method: 'POST', body: { email: form.email } });
      setInfo(d.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>Log in</h1>
      <label>Email
        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
      </label>
      <PasswordField value={form.password} onChange={set('password')} autoComplete="current-password" />
      <Messages error={error} info={info} />
      {unverified && <button type="button" className="btn ghost" onClick={resend}>Send a new verification email</button>}
      <button className="btn" disabled={busy}>Log in</button>
      <p className="muted"><Link to="/forgot-password">Forgot your password?</Link></p>
      <p className="muted">New student? <Link to="/register">Create an account</Link></p>
    </form>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', familyIncome: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const d = await register(form);
      if (d.needsVerification) setDone(d.message);
      else navigate('/student', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="panel narrow">
        <h1>Check your email</h1>
        <p role="status">{done}</p>
        <Link className="btn" to="/login">Go to log in</Link>
      </div>
    );
  }

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>Create your student account</h1>
      <label>Full name
        <input value={form.name} onChange={set('name')} autoComplete="name" required />
      </label>
      <label>Email
        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
      </label>
      <PasswordField value={form.password} onChange={set('password')} autoComplete="new-password" />
      <label>Annual family income
        <input type="number" min="0" value={form.familyIncome} onChange={set('familyIncome')} required />
        <small className="muted">Used only to match you with scholarships you qualify for. You can add more details in your profile later.</small>
      </label>
      <Messages error={error} />
      <button className="btn" disabled={busy}>Create account</button>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    try {
      const d = await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setInfo(d.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>Reset your password</h1>
      <label>Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <Messages error={error} info={info} />
      <button className="btn" disabled={busy}>Send reset link</button>
      <p className="muted"><Link to="/login">Back to log in</Link></p>
    </form>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const d = await api('/auth/reset-password', { method: 'POST', body: { token, password } });
      setInfo(d.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="panel narrow">
        <h1>Reset link missing</h1>
        <p>Open the link from your email, or <Link to="/forgot-password">request a new one</Link>.</p>
      </div>
    );
  }
  if (info) {
    return (
      <div className="panel narrow">
        <h1>Password updated</h1>
        <p role="status">{info}</p>
        <Link className="btn" to="/login">Log in</Link>
      </div>
    );
  }
  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>Choose a new password</h1>
      <PasswordField label="New password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      <Messages error={error} />
      <button className="btn" disabled={busy}>Save new password</button>
    </form>
  );
}

export function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: 'loading', message: '' });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // the token works once, so do not run twice in dev
    ran.current = true;
    api('/auth/verify-email', { method: 'POST', body: { token: params.get('token') } })
      .then((d) => setState({ status: 'ok', message: d.message }))
      .catch((e) => setState({ status: 'error', message: e.message }));
  }, [params]);

  return (
    <div className="panel narrow">
      <h1>Email verification</h1>
      {state.status === 'loading' && <p>Verifying…</p>}
      {state.status === 'ok' && <p className="ok" role="status">{state.message}</p>}
      {state.status === 'error' && <p className="error" role="alert">{state.message}</p>}
      {state.status !== 'loading' && <Link className="btn" to="/login">Go to log in</Link>}
    </div>
  );
}