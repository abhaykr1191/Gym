import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', plan: 'Basic', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/portal');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Join Ironhouse</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Full name
          <input value={form.name} onChange={update('name')} required />
        </label>
        <label>
          Email
          <input value={form.email} onChange={update('email')} type="email" required />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={update('phone')} />
        </label>
        <label>
          Membership plan
          <select value={form.plan} onChange={update('plan')}>
            <option>Basic</option>
            <option>Premium</option>
            <option>Elite</option>
          </select>
        </label>
        <label>
          Password
          <input value={form.password} onChange={update('password')} type="password" required minLength={6} />
        </label>
        <button className="btn block" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="muted">
          Already a member? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
