# Ironhouse Gym

Gym website with a member portal and an owner dashboard for managing staff, members, and personal-trainer assignments.

## Flow

1. A member joins and logs in to the portal.
2. The member requests a personal trainer: goal, sessions/week, duration, preferred time, and **the price per session they are willing to pay**.
3. The owner sees the request in the dashboard, sets the final rate, and assigns a staff trainer.
4. The member sees the assigned trainer and confirmed rate in the portal.

## Stack

- `server/` — Express 5 JSON API, file-backed store (`server/data.json`, seeded on first run)
- `client/` — React + Vite, React Router, dev proxy to the API

## Run locally

```bash
cd server && npm install && npm start      # http://localhost:3001
cd client && npm install && npm run dev    # http://localhost:5173
```

## Demo accounts

| Role   | Email                 | Password   |
| ------ | --------------------- | ---------- |
| Owner  | owner@ironhouse.fit   | owner123   |
| Member | mia@example.com       | member123  |

## API

| Method | Path                        | Access | Purpose                              |
| ------ | --------------------------- | ------ | ------------------------------------ |
| POST   | `/api/auth/register`        | public | member signup                        |
| POST   | `/api/auth/login`           | public | login                                |
| GET    | `/api/staff`                | auth   | list staff (members see active only) |
| POST   | `/api/staff`                | owner  | add staff                            |
| PATCH  | `/api/staff/:id`            | owner  | edit / activate / deactivate         |
| DELETE | `/api/staff/:id`            | owner  | remove staff                         |
| GET    | `/api/members`              | owner  | list members                         |
| POST   | `/api/members`              | owner  | add member                           |
| PATCH  | `/api/members/:id`          | owner  | change plan / suspend                |
| DELETE | `/api/members/:id`          | owner  | remove member                        |
| GET    | `/api/requests`             | auth   | owner: all, member: own              |
| POST   | `/api/requests`             | member | request a trainer with offered price |
| POST   | `/api/requests/:id/assign`  | owner  | assign trainer + final price         |
| POST   | `/api/requests/:id/reject`  | owner  | decline a request                    |
| GET    | `/api/stats`                | owner  | dashboard counters                   |

Authentication uses in-memory bearer tokens and plaintext demo passwords — fine for a prototype, replace with hashed passwords and signed sessions before production.
