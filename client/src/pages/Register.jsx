import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const plans = ['Basic', 'Premium', 'Elite'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get('plan');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    plan: plans.includes(requestedPlan) ? requestedPlan : 'Basic',
    password: '',
  });
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
            {plans.map((plan) => (
              <option key={plan}>{plan}</option>
            ))}
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
