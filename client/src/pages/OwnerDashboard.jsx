import { useEffect, useState } from 'react';
import { api } from '../api';

const trainerRoles = ['Personal Trainer', 'Yoga Coach'];
const emptyStaff = { name: '', email: '', phone: '', role: 'Personal Trainer', specialties: '', hourlyRate: 50, capacity: 8 };
const emptyMember = { name: '', email: '', phone: '', plan: 'Basic', password: '' };

function Stat({ label, value }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function OwnerDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [staff, setStaff] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [staffForm, setStaffForm] = useState(emptyStaff);
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [assignDraft, setAssignDraft] = useState({});
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([api('/stats'), api('/staff'), api('/members'), api('/requests')])
      .then(([s, st, m, r]) => {
        setStats(s.stats);
        setStaff(st.staff);
        setMembers(m.members);
        setRequests(r.requests);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const run = async (fn) => {
    setError('');
    try {
      await fn();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const trainers = staff.filter((s) => trainerRoles.includes(s.role) && s.active);
  const assignedCount = (staffId) => requests.filter((r) => r.assignedStaffId === staffId && r.status === 'assigned').length;

  return (
    <div className="dashboard">
      <header className="page-head">
        <div>
          <h1>Owner dashboard</h1>
          <p className="muted">Manage staff, members, and trainer assignments.</p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <nav className="tabs">
        {['overview', 'requests', 'staff', 'members'].map((t) => (
          <button key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
            {t === 'requests' && stats?.pendingRequests ? <span className="pill">{stats.pendingRequests}</span> : null}
          </button>
        ))}
      </nav>

      {tab === 'overview' && stats && (
        <>
          <div className="stat-grid">
            <Stat label="Members" value={stats.members} />
            <Stat label="Active members" value={stats.activeMembers} />
            <Stat label="Staff" value={stats.staff} />
            <Stat label="Trainers" value={stats.trainers} />
            <Stat label="Pending requests" value={stats.pendingRequests} />
            <Stat label="Est. PT revenue / mo" value={`$${stats.monthlyRevenue.toLocaleString()}`} />
          </div>
          <section className="card">
            <h2>Latest trainer requests</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Goal</th>
                  <th>Offered</th>
                  <th>Status</th>
                  <th>Trainer</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td>{r.member?.name}</td>
                    <td>{r.goal}</td>
                    <td>${r.offeredPrice}/session</td>
                    <td>
                      <span className={`badge ${r.status}`}>{r.status}</span>
                    </td>
                    <td>{r.assignedStaff?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === 'requests' && (
        <section className="card">
          <h2>Trainer requests</h2>
          {requests.length === 0 && <p className="muted">No requests yet.</p>}
          <ul className="request-list">
            {requests.map((r) => {
              const draft = assignDraft[r.id] || { staffId: '', quotedPrice: r.offeredPrice };
              return (
                <li key={r.id}>
                  <div className="request-top">
                    <strong>
                      {r.member?.name} · {r.goal}
                    </strong>
                    <span className={`badge ${r.status}`}>{r.status}</span>
                  </div>
                  <p className="muted">
                    {r.sessionsPerWeek}×/week for {r.durationWeeks} weeks · {r.preferredTime} · member offers{' '}
                    <strong>${r.offeredPrice}/session</strong> · program value $
                    {(r.offeredPrice * r.sessionsPerWeek * r.durationWeeks).toLocaleString()}
                  </p>
                  {r.notes && <p className="notes">“{r.notes}”</p>}
                  {r.status === 'assigned' && r.assignedStaff && (
                    <p className="assigned">
                      Assigned to <strong>{r.assignedStaff.name}</strong> at ${r.quotedPrice}/session
                    </p>
                  )}
                  <div className="assign-row">
                    <select
                      value={draft.staffId}
                      onChange={(e) => setAssignDraft({ ...assignDraft, [r.id]: { ...draft, staffId: e.target.value } })}
                    >
                      <option value="">Select trainer…</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — ${t.hourlyRate}/session · {assignedCount(t.id)}/{t.capacity} clients
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={draft.quotedPrice}
                      onChange={(e) => setAssignDraft({ ...assignDraft, [r.id]: { ...draft, quotedPrice: e.target.value } })}
                      placeholder="Final price"
                    />
                    <button
                      className="btn"
                      onClick={() =>
                        run(() =>
                          api(`/requests/${r.id}/assign`, {
                            method: 'POST',
                            body: { staffId: draft.staffId, quotedPrice: draft.quotedPrice },
                          }),
                        )
                      }
                    >
                      {r.status === 'assigned' ? 'Reassign' : 'Assign trainer'}
                    </button>
                    <button className="btn ghost" onClick={() => run(() => api(`/requests/${r.id}/reject`, { method: 'POST' }))}>
                      Decline
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tab === 'staff' && (
        <div className="split">
          <section className="card">
            <h2>Staff</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Rate</th>
                  <th>Clients</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <div className="muted small">{s.email}</div>
                    </td>
                    <td>
                      {s.role}
                      <div className="muted small">{s.specialties.join(', ')}</div>
                    </td>
                    <td>${s.hourlyRate}</td>
                    <td>
                      {assignedCount(s.id)}/{s.capacity}
                    </td>
                    <td>
                      <span className={`badge ${s.active ? 'assigned' : 'rejected'}`}>{s.active ? 'active' : 'inactive'}</span>
                    </td>
                    <td className="actions">
                      <button className="link" onClick={() => run(() => api(`/staff/${s.id}`, { method: 'PATCH', body: { active: !s.active } }))}>
                        {s.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="link danger" onClick={() => run(() => api(`/staff/${s.id}`, { method: 'DELETE' }))}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api('/staff', { method: 'POST', body: staffForm });
                setStaffForm(emptyStaff);
              });
            }}
          >
            <h2>Add staff</h2>
            <label>
              Name
              <input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
            </label>
            <label>
              Phone
              <input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
            </label>
            <label>
              Role
              <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                <option>Personal Trainer</option>
                <option>Yoga Coach</option>
                <option>Front Desk</option>
                <option>Manager</option>
                <option>Cleaner</option>
              </select>
            </label>
            <label>
              Specialties (comma separated)
              <input value={staffForm.specialties} onChange={(e) => setStaffForm({ ...staffForm, specialties: e.target.value })} />
            </label>
            <div className="row">
              <label>
                Rate / session ($)
                <input type="number" value={staffForm.hourlyRate} onChange={(e) => setStaffForm({ ...staffForm, hourlyRate: e.target.value })} />
              </label>
              <label>
                Client capacity
                <input type="number" value={staffForm.capacity} onChange={(e) => setStaffForm({ ...staffForm, capacity: e.target.value })} />
              </label>
            </div>
            <button className="btn block">Add staff member</button>
          </form>
        </div>
      )}

      {tab === 'members' && (
        <div className="split">
          <section className="card">
            <h2>Members</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Plan</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.name}</strong>
                      <div className="muted small">{m.email}</div>
                    </td>
                    <td>
                      <select value={m.plan} onChange={(e) => run(() => api(`/members/${m.id}`, { method: 'PATCH', body: { plan: e.target.value } }))}>
                        <option>Basic</option>
                        <option>Premium</option>
                        <option>Elite</option>
                      </select>
                    </td>
                    <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${m.active ? 'assigned' : 'rejected'}`}>{m.active ? 'active' : 'inactive'}</span>
                    </td>
                    <td className="actions">
                      <button className="link" onClick={() => run(() => api(`/members/${m.id}`, { method: 'PATCH', body: { active: !m.active } }))}>
                        {m.active ? 'Suspend' : 'Reactivate'}
                      </button>
                      <button className="link danger" onClick={() => run(() => api(`/members/${m.id}`, { method: 'DELETE' }))}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api('/members', { method: 'POST', body: memberForm });
                setMemberForm(emptyMember);
              });
            }}
          >
            <h2>Add member</h2>
            <label>
              Name
              <input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} required />
            </label>
            <label>
              Phone
              <input value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} />
            </label>
            <label>
              Plan
              <select value={memberForm.plan} onChange={(e) => setMemberForm({ ...memberForm, plan: e.target.value })}>
                <option>Basic</option>
                <option>Premium</option>
                <option>Elite</option>
              </select>
            </label>
            <label>
              Temporary password
              <input value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} placeholder="member123" />
            </label>
            <button className="btn block">Add member</button>
          </form>
        </div>
      )}
    </div>
  );
}
