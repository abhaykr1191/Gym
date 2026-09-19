import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './passwords.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const file = process.env.DB_FILE || path.join(dir, 'data.json');

const seed = () => ({
  users: [
    {
      id: 'u-owner',
      name: 'Alex Carter',
      email: process.env.OWNER_EMAIL || 'owner@ironhouse.fit',
      password: hashPassword(process.env.OWNER_PASSWORD || 'owner123'),
      role: 'owner',
      phone: '555-0100',
      createdAt: '2024-01-05T09:00:00.000Z',
      active: true,
    },
    {
      id: 'u-mia',
      name: 'Mia Nguyen',
      email: 'mia@example.com',
      password: hashPassword('member123'),
      role: 'member',
      phone: '555-0111',
      plan: 'Premium',
      createdAt: '2024-03-12T09:00:00.000Z',
      active: true,
    },
    {
      id: 'u-raj',
      name: 'Raj Patel',
      email: 'raj@example.com',
      password: hashPassword('member123'),
      role: 'member',
      phone: '555-0112',
      plan: 'Basic',
      createdAt: '2024-06-01T09:00:00.000Z',
      active: true,
    },
  ],
  staff: [
    {
      id: 's-1',
      name: 'Dana Reyes',
      email: 'dana@ironhouse.fit',
      phone: '555-0201',
      role: 'Personal Trainer',
      specialties: ['Strength', 'Powerlifting'],
      hourlyRate: 55,
      capacity: 8,
      active: true,
    },
    {
      id: 's-2',
      name: 'Tom Alvarez',
      email: 'tom@ironhouse.fit',
      phone: '555-0202',
      role: 'Personal Trainer',
      specialties: ['Weight Loss', 'HIIT'],
      hourlyRate: 45,
      capacity: 10,
      active: true,
    },
    {
      id: 's-3',
      name: 'Priya Shah',
      email: 'priya@ironhouse.fit',
      phone: '555-0203',
      role: 'Yoga Coach',
      specialties: ['Yoga', 'Mobility'],
      hourlyRate: 40,
      capacity: 12,
      active: true,
    },
    {
      id: 's-4',
      name: 'Greg Miles',
      email: 'greg@ironhouse.fit',
      phone: '555-0204',
      role: 'Front Desk',
      specialties: ['Reception'],
      hourlyRate: 20,
      capacity: 0,
      active: true,
    },
  ],
  requests: [
    {
      id: 'r-1',
      memberId: 'u-raj',
      goal: 'Weight Loss',
      sessionsPerWeek: 3,
      durationWeeks: 8,
      preferredTime: 'Evening',
      offeredPrice: 40,
      notes: 'Prefer a trainer experienced with beginners.',
      status: 'pending',
      quotedPrice: null,
      assignedStaffId: null,
      createdAt: '2024-07-02T10:00:00.000Z',
    },
  ],
});

let state = null;

const load = () => {
  if (state) return state;
  if (fs.existsSync(file)) {
    state = JSON.parse(fs.readFileSync(file, 'utf8'));
  } else {
    state = seed();
    save();
  }
  return state;
};

const save = () => {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, file);
};

export const db = {
  get data() {
    return load();
  },
  save,
  reset() {
    state = seed();
    save();
  },
};

export const nextId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
