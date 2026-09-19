import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext.jsx';

const trainerRoles = ['Personal Trainer', 'Yoga Coach'];
const goals = ['Weight Loss', 'Strength', 'Muscle Gain', 'Mobility', 'Sport Specific', 'General Fitness'];
const times = ['Morning', 'Afternoon', 'Evening', 'Flexible'];

const emptyForm = {
  goal: 'Strength',
  sessionsPerWeek: 2,
  durationWeeks: 8,
  preferredTime: 'Evening',
  offeredPrice: '',
  notes: '',
};

export default function MemberPortal() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    api('/requests').then(({ requests }) => setRequests(requests)).catch((e) => setError(e.message));
    api('/staff')
      .then(({ staff }) => setTrainers(staff.filter((s) => trainerRoles.includes(s.role))))
      .catch(() => {});
  };

  useEffect(load, []);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const total = Number(form.offeredPrice || 0) * Number(form.sessionsPerWeek || 0) * Number(form.durationWeeks || 0);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/requests', { method: 'POST', body: form });
      setForm(emptyForm);
      setMessage('Request sent. The gym owner will assign a trainer shortly.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="portal">
      <header className="page-head">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="muted">
            {user.plan} membership · member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </header>

      <div className="portal-grid">
        <form className="card" onSubmit={submit}>
          <h2>Request a personal trainer</h2>
          <p className="muted">Tell us what you need and the price per session you want to pay.</p>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <label>
            Training goal
            <select value={form.goal} onChange={update('goal')}>
              {goals.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>

          <div className="row">
            <label>
              Sessions per week
              <input type="number" min="1" max="7" value={form.sessionsPerWeek} onChange={update('sessionsPerWeek')} />
            </label>
            <label>
              Duration (weeks)
              <input type="number" min="1" max="52" value={form.durationWeeks} onChange={update('durationWeeks')} />
            </label>
          </div>

          <div className="row">
            <label>
              Preferred time
              <select value={form.preferredTime} onChange={update('preferredTime')}>
                {times.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Your price per session ($)
              <input type="number" min="1" step="1" value={form.offeredPrice} onChange={update('offeredPrice')} required />
            </label>
          </div>

          <label>
            Notes for the owner
            <textarea rows="3" value={form.notes} onChange={update('notes')} placeholder="Injuries, experience, preferences…" />
          </label>

          <p className="estimate">
            Estimated program total: <strong>${total.toLocaleString()}</strong>
          </p>
          <button className="btn block">Send request</button>
        </form>

        <section className="card">
          <h2>My trainer requests</h2>
          {requests.length === 0 && <p className="muted">No requests yet.</p>}
          <ul className="request-list">
            {requests.map((r) => (
              <li key={r.id}>
                <div className="request-top">
                  <strong>{r.goal}</strong>
                  <span className={`badge ${r.status}`}>{r.status}</span>
                </div>
                <p className="muted">
                  {r.sessionsPerWeek}×/week for {r.durationWeeks} weeks · {r.preferredTime} · offered ${r.offeredPrice}/session
                </p>
                {r.status === 'assigned' && r.assignedStaff && (
                  <p className="assigned">
                    Trainer: <strong>{r.assignedStaff.name}</strong> ({r.assignedStaff.specialties.join(', ')}) · confirmed rate $
                    {r.quotedPrice}/session
                  </p>
                )}
                {r.status === 'rejected' && <p className="error-soft">Declined{r.notesFromOwner ? `: ${r.notesFromOwner}` : ''}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="section">
        <h2>Our trainers</h2>
        <div className="trainer-grid">
          {trainers.map((t) => (
            <div key={t.id} className="card trainer">
              <h3>{t.name}</h3>
              <p className="muted">{t.specialties.join(' · ')}</p>
              <p className="rate">${t.hourlyRate}/session</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
