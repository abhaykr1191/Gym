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

## Configuration

| Variable          | Default                 | Purpose                                     |
| ----------------- | ----------------------- | ------------------------------------------- |
| `PORT`            | `3001`                  | API port                                    |
| `DB_FILE`         | `server/data.json`      | store location                              |
| `CLIENT_ORIGIN`   | `http://localhost:5173` | allowed CORS origins (comma separated)      |
| `OWNER_EMAIL`     | `owner@ironhouse.fit`   | seeded owner login                          |
| `OWNER_PASSWORD`  | `owner123`              | seeded owner password — set this on deploy  |
| `SESSION_TTL_MS`  | `43200000` (12h)        | bearer token lifetime                       |
| `AUTH_RATE_LIMIT` | `20`                    | login/register attempts per IP per 15 min   |

Passwords are hashed with scrypt. Sessions are in-memory bearer tokens (one per user, expiring after `SESSION_TTL_MS`), so all sessions end when the process restarts — swap in signed cookies or a session store before production.
