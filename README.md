# AtomQuest — Goal Setting & Tracking Portal

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + React Hook Form + Zod + React Query
- **Backend**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (access + refresh tokens) + bcrypt

---

## Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a connection string)

---

## Setup

### 1. Database
Create a PostgreSQL database:
```sql
CREATE DATABASE atomquest;
```

### 2. Backend
```bash
cd backend
cp .env .env.local   # edit DATABASE_URL and secrets
npm install
npm run db:migrate   # runs Prisma migrations
npm run db:seed      # creates demo users
npm run dev          # starts on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:5173
```

---

## Demo Credentials
| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | admin@company.com        | Admin@123     |
| Manager  | manager@company.com      | Manager@123   |
| Employee | employee@company.com     | Employee@123  |

---

## Architecture

### State Machine (Goal Sheet lifecycle)
```
DRAFT → SUBMITTED → APPROVED
              ↓
            REWORK → SUBMITTED
```
- Once `APPROVED`, all goal writes are blocked by `guardApprovedSheet` middleware
- Admin override token bypasses the guard for corrections

### RBAC
| Action                        | EMPLOYEE | MANAGER | ADMIN |
|-------------------------------|----------|---------|-------|
| Create/edit own goals         | ✅       | ✅      | ✅    |
| Submit sheet                  | ✅       | ✅      | ✅    |
| Approve / request rework      | ❌       | ✅      | ✅    |
| View team sheets              | ❌       | ✅      | ✅    |
| Add check-in comments         | ❌       | ✅      | ✅    |
| Override approved sheet       | ❌       | ❌      | ✅    |

### Scoring Engine (`backend/src/services/scoring.service.ts`)
Pure function — takes `{ uomType, target, actual }`, returns 0–1 score.
Runs server-side only. Same logic used for display, reports, and analytics.

### Weightage Validation
- **API level**: checked in `goal.controller.ts` before every create/update
- **Defense in depth**: frontend live meter turns red before submission is even attempted

### Shared Goals
When a goal with `isShared=true` logs an actual, the fan-out to all linked goals
(same `sharedOwnerId`) happens atomically in `logActual` via `Promise.all` upserts.

---

## API Reference

### Auth
| Method | Path               | Body                        |
|--------|--------------------|-----------------------------|
| POST   | /api/auth/login    | `{ email, password }`       |
| POST   | /api/auth/refresh  | `{ refreshToken }`          |

### Sheets
| Method | Path                          | Auth         |
|--------|-------------------------------|--------------|
| POST   | /api/sheets                   | EMPLOYEE     |
| GET    | /api/sheets                   | Any          |
| GET    | /api/sheets/team              | MANAGER+     |
| GET    | /api/sheets/:id               | Owner/Mgr    |
| PATCH  | /api/sheets/:id/status        | Any (RBAC)   |
| GET    | /api/sheets/:id/score         | Any          |

### Goals
| Method | Path                          | Auth         |
|--------|-------------------------------|--------------|
| POST   | /api/sheets/:id/goals         | EMPLOYEE     |
| PATCH  | /api/goals/:id                | Owner        |
| DELETE | /api/goals/:id                | Owner        |
| POST   | /api/goals/:id/actuals        | Any          |

### Comments
| Method | Path                          | Auth         |
|--------|-------------------------------|--------------|
| POST   | /api/sheets/:id/comments      | MANAGER+     |
| GET    | /api/sheets/:id/comments      | Any          |
