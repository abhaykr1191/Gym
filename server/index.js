import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { db, nextId } from './db.js';
import { hashPassword, verifyPassword } from './passwords.js';

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 12 * 60 * 60 * 1000;
const TRAINER_ROLES = ['Personal Trainer', 'Yoga Coach'];

const app = express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

/** token -> { userId, expiresAt } */
const sessions = new Map();

const pruneSessions = () => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
};
setInterval(pruneSessions, 10 * 60 * 1000).unref();

const startSession = (user) => {
  pruneSessions();
  for (const [token, session] of sessions) {
    if (session.userId === user.id) sessions.delete(token);
  }
  const token = crypto.randomUUID();
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
};

const attempts = new Map();
const rateLimitAuth = (req, res, next) => {
  const windowMs = 15 * 60 * 1000;
  const max = Number(process.env.AUTH_RATE_LIMIT) || 20;
  const now = Date.now();
  const key = req.ip;
  const record = attempts.get(key);
  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  record.count += 1;
  if (record.count > max) return res.status(429).json({ error: 'Too many attempts, try again later' });
  next();
};

const publicUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const authenticate = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const session = sessions.get(token);
  if (session && session.expiresAt <= Date.now()) sessions.delete(token);
  const user = session ? db.data.users.find((u) => u.id === session.userId) : null;
  if (!user || session.expiresAt <= Date.now()) return res.status(401).json({ error: 'Not authenticated' });
  if (!user.active) return res.status(403).json({ error: 'This account is deactivated' });
  req.user = user;
  next();
};

const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Owner access required' });
  next();
};

app.post('/api/auth/register', rateLimitAuth, (req, res) => {
  const { name, email, password, phone, plan } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (db.data.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: 'An account with that email already exists' });

  const user = {
    id: nextId('u'),
    name,
    email,
    password: hashPassword(password),
    phone: phone || '',
    plan: plan || 'Basic',
    role: 'member',
    createdAt: new Date().toISOString(),
    active: true,
  };
  db.data.users.push(user);
  db.save();

  res.status(201).json({ token: startSession(user), user: publicUser(user) });
});

app.post('/api/auth/login', rateLimitAuth, (req, res) => {
  const { email, password } = req.body;
  const user = db.data.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !verifyPassword(password || '', user.password)) return res.status(401).json({ error: 'Invalid email or password' });
  if (!user.active) return res.status(403).json({ error: 'This account is deactivated' });
  res.json({ token: startSession(user), user: publicUser(user) });
});

app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

app.post('/api/auth/logout', authenticate, (req, res) => {
  sessions.delete((req.headers.authorization || '').replace('Bearer ', ''));
  res.json({ ok: true });
});

// ---- staff ----
app.get('/api/staff', authenticate, (req, res) => {
  const staff = req.user.role === 'owner' ? db.data.staff : db.data.staff.filter((s) => s.active);
  res.json({ staff });
});

app.post('/api/staff', authenticate, ownerOnly, (req, res) => {
  const { name, email, phone, role, specialties, hourlyRate, capacity } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  const member = {
    id: nextId('s'),
    name,
    email,
    phone: phone || '',
    role: role || 'Personal Trainer',
    specialties: Array.isArray(specialties) ? specialties : String(specialties || '').split(',').map((s) => s.trim()).filter(Boolean),
    hourlyRate: Number(hourlyRate) || 0,
    capacity: Number(capacity) || 0,
    active: true,
  };
  db.data.staff.push(member);
  db.save();
  res.status(201).json({ staff: member });
});

app.patch('/api/staff/:id', authenticate, ownerOnly, (req, res) => {
  const member = db.data.staff.find((s) => s.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Staff member not found' });
  const { name, email, phone, role, specialties, hourlyRate, capacity, active } = req.body;
  if (name !== undefined) member.name = name;
  if (email !== undefined) member.email = email;
  if (phone !== undefined) member.phone = phone;
  if (role !== undefined) member.role = role;
  if (specialties !== undefined)
    member.specialties = Array.isArray(specialties) ? specialties : String(specialties).split(',').map((s) => s.trim()).filter(Boolean);
  if (hourlyRate !== undefined) member.hourlyRate = Number(hourlyRate);
  if (capacity !== undefined) member.capacity = Number(capacity);
  if (active !== undefined) member.active = Boolean(active);
  db.save();
  res.json({ staff: member });
});

app.delete('/api/staff/:id', authenticate, ownerOnly, (req, res) => {
  const index = db.data.staff.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Staff member not found' });
  const [removed] = db.data.staff.splice(index, 1);
  db.data.requests.forEach((r) => {
    if (r.assignedStaffId === removed.id) clearAssignment(r, 'pending');
  });
  db.save();
  res.json({ ok: true });
});

// ---- members ----
app.get('/api/members', authenticate, ownerOnly, (req, res) => {
  res.json({ members: db.data.users.filter((u) => u.role === 'member').map(publicUser) });
});

app.post('/api/members', authenticate, ownerOnly, (req, res) => {
  const { name, email, phone, plan, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (db.data.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: 'An account with that email already exists' });
  const member = {
    id: nextId('u'),
    name,
    email,
    password: hashPassword(password || 'member123'),
    phone: phone || '',
    plan: plan || 'Basic',
    role: 'member',
    createdAt: new Date().toISOString(),
    active: true,
  };
  db.data.users.push(member);
  db.save();
  res.status(201).json({ member: publicUser(member) });
});

app.patch('/api/members/:id', authenticate, ownerOnly, (req, res) => {
  const member = db.data.users.find((u) => u.id === req.params.id && u.role === 'member');
  if (!member) return res.status(404).json({ error: 'Member not found' });
  const { name, email, phone, plan, active } = req.body;
  if (name !== undefined) member.name = name;
  if (email !== undefined) member.email = email;
  if (phone !== undefined) member.phone = phone;
  if (plan !== undefined) member.plan = plan;
  if (active !== undefined) member.active = Boolean(active);
  db.save();
  res.json({ member: publicUser(member) });
});

app.delete('/api/members/:id', authenticate, ownerOnly, (req, res) => {
  const index = db.data.users.findIndex((u) => u.id === req.params.id && u.role === 'member');
  if (index === -1) return res.status(404).json({ error: 'Member not found' });
  db.data.users.splice(index, 1);
  db.data.requests = db.data.requests.filter((r) => r.memberId !== req.params.id);
  db.save();
  res.json({ ok: true });
});

// ---- trainer requests ----
const clearAssignment = (request, status) => {
  request.assignedStaffId = null;
  request.quotedPrice = null;
  request.assignedAt = null;
  request.status = status;
};

const withDetails = (request) => ({
  ...request,
  member: publicUser(db.data.users.find((u) => u.id === request.memberId)),
  assignedStaff: db.data.staff.find((s) => s.id === request.assignedStaffId) || null,
});

app.get('/api/requests', authenticate, (req, res) => {
  const all = db.data.requests
    .filter((r) => req.user.role === 'owner' || r.memberId === req.user.id)
    .map(withDetails)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ requests: all });
});

app.post('/api/requests', authenticate, (req, res) => {
  const { goal, sessionsPerWeek, durationWeeks, preferredTime, offeredPrice, notes } = req.body;
  const price = Number(offeredPrice);
  if (!goal) return res.status(400).json({ error: 'Please pick a training goal' });
  if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Enter the price per session you are willing to pay' });

  const request = {
    id: nextId('r'),
    memberId: req.user.id,
    goal,
    sessionsPerWeek: Number(sessionsPerWeek) || 1,
    durationWeeks: Number(durationWeeks) || 4,
    preferredTime: preferredTime || 'Flexible',
    offeredPrice: price,
    notes: notes || '',
    status: 'pending',
    quotedPrice: null,
    assignedStaffId: null,
    createdAt: new Date().toISOString(),
  };
  db.data.requests.push(request);
  db.save();
  res.status(201).json({ request: withDetails(request) });
});

app.post('/api/requests/:id/assign', authenticate, ownerOnly, (req, res) => {
  const request = db.data.requests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const staff = db.data.staff.find((s) => s.id === req.body.staffId);
  if (!staff) return res.status(400).json({ error: 'Pick a staff member to assign' });
  if (!staff.active) return res.status(400).json({ error: 'That staff member is inactive' });
  if (!TRAINER_ROLES.includes(staff.role)) return res.status(400).json({ error: 'Only coaching staff can be assigned to a trainer request' });

  const quoted = req.body.quotedPrice === undefined || req.body.quotedPrice === '' ? staff.hourlyRate : Number(req.body.quotedPrice);
  if (!Number.isFinite(quoted) || quoted <= 0) return res.status(400).json({ error: 'Quoted price must be a positive number' });

  request.assignedStaffId = staff.id;
  request.quotedPrice = quoted;
  request.status = 'assigned';
  request.assignedAt = new Date().toISOString();
  db.save();
  res.json({ request: withDetails(request) });
});

app.post('/api/requests/:id/reject', authenticate, ownerOnly, (req, res) => {
  const request = db.data.requests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  clearAssignment(request, 'rejected');
  request.notesFromOwner = req.body.reason || '';
  db.save();
  res.json({ request: withDetails(request) });
});

// ---- dashboard stats ----
app.get('/api/stats', authenticate, ownerOnly, (req, res) => {
  const members = db.data.users.filter((u) => u.role === 'member');
  const requests = db.data.requests;
  const assigned = requests.filter((r) => r.status === 'assigned');
  const monthlyRevenue = assigned.reduce((sum, r) => sum + r.quotedPrice * r.sessionsPerWeek * 4, 0);
  res.json({
    stats: {
      members: members.length,
      activeMembers: members.filter((m) => m.active).length,
      staff: db.data.staff.length,
      trainers: db.data.staff.filter((s) => TRAINER_ROLES.includes(s.role)).length,
      pendingRequests: requests.filter((r) => r.status === 'pending').length,
      assignedRequests: assigned.length,
      monthlyRevenue,
    },
  });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`Gym API listening on http://localhost:${port}`));
