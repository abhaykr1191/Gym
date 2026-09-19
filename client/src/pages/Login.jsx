import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'owner' ? '/dashboard' : '/portal');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Log in</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button className="btn block" disabled={busy}>
          {busy ? 'Signing in…' : 'Log in'}
        </button>
        <p className="muted">
          No account? <Link to="/register">Join the gym</Link>
        </p>
        <div className="demo-box">
          <p>Demo accounts</p>
          <button type="button" className="btn ghost block" onClick={() => fill('owner@ironhouse.fit', 'owner123')}>
            Owner · owner@ironhouse.fit
          </button>
          <button type="button" className="btn ghost block" onClick={() => fill('mia@example.com', 'member123')}>
            Member · mia@example.com
          </button>
        </div>
      </form>
    </div>
  );
}
