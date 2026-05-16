# AtomQuest — Goal Setting & Tracking Portal

> **AtomQuest Hackathon 1.0** submission · In-House Goal Setting & Tracking Portal

A full-stack, role-based web portal that manages the complete lifecycle of employee goals — from creation and manager approval through quarterly check-ins, progress scoring, and audit-ready reporting. Built for [Atomberg](https://atomberg.com).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Demo Credentials](#demo-credentials)
- [Architecture](#architecture)
  - [Goal Sheet State Machine](#goal-sheet-state-machine)
  - [RBAC Matrix](#rbac-matrix)
  - [Scoring Engine](#scoring-engine)
  - [Weightage Validation](#weightage-validation)
  - [Shared Goals](#shared-goals)
  - [Cycle Windows](#cycle-windows)
- [API Reference](#api-reference)
- [BRD Compliance Checklist](#brd-compliance-checklist)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Evaluation Criteria Coverage](#evaluation-criteria-coverage)

---

## Features

### Phase 1 — Goal Creation & Approval
- Employee interface to create a Goal Sheet with up to **8 goals** per cycle
- Select **Thrust Area**, define Goal Title/Description, assign **Unit of Measurement** (Numeric Min, Numeric Max, %, Timeline, Zero-based), set Targets and Weightage
- System-enforced validation: total weightage must equal **100%**, minimum per goal **10%**, maximum **8 goals**
- **Manager (L1) Approval Workflow**: inline editing of targets/weightages, approve or return for rework
- Goals locked on approval — edits require Admin override
- **Shared Goals**: Admin/Manager can push a departmental KPI to multiple employees; recipients adjust weightage only; achievement syncs from primary owner atomically

### Phase 2 — Achievement Tracking & Quarterly Check-ins
- Quarterly update interface: log Actual Achievement against Planned Targets
- Per-goal status: `Not Started` / `On Track` / `Completed`
- **Manager Check-in module**: view Planned vs. Actual per team member, add structured check-in comments (append-only, audit-safe)
- System-computed progress scores per UoM formula (display/tracking only, not performance ratings)
- Cycle window enforcement — each quarter's update window opens on the configured date; past quarters are read-only

### Reporting & Governance
- **Achievement Report**: exportable CSV/Excel — Planned Target vs. Actual Achievement for all employees
- **Completion Dashboard**: real-time view of check-in completion across employees and managers
- **Audit Trail**: every post-lock change is logged with who changed what and when (JSONB diff)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Hook Form, Zod, React Query |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Cache / Sessions | Redis |
| Auth | JWT (access + refresh tokens), bcrypt |
| File Exports | exceljs (server-side CSV/XLSX generation) |
| Deployment | Docker, Railway / Render, Nginx, GitHub Actions |

---

## Project Structure

```
atomquest/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # DB schema — users, goals, actuals, audit log
│   │   ├── migrations/           # Prisma migration history
│   │   └── seed.ts               # Seeds 3 demo users (Employee, Manager, Admin)
│   ├── src/
│   │   ├── controllers/          # Route handlers (auth, sheets, goals, comments, reports)
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   ├── rbac.ts           # requireRole(...roles) guard
│   │   │   └── guardApproved.ts  # Blocks writes to approved sheets
│   │   ├── services/
│   │   │   ├── scoring.service.ts    # Pure scoring function (Min/Max/Timeline/Zero)
│   │   │   ├── cycle.service.ts      # Determines active quarter window
│   │   │   ├── approval.service.ts   # Sheet state machine transitions
│   │   │   └── report.service.ts     # CSV/XLSX export generation
│   │   ├── routes/               # Express routers
│   │   └── index.ts              # App entry point
│   ├── .env                      # Environment variable template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Employee/         # Goal sheet, quarterly update
│   │   │   ├── Manager/          # Team dashboard, approval, check-in
│   │   │   └── Admin/            # Cycle config, audit log, reports
│   │   ├── components/           # Shared UI components
│   │   ├── hooks/                # React Query hooks for data fetching
│   │   ├── lib/
│   │   │   └── zod-schemas.ts    # Shared validation schemas (mirrors backend)
│   │   └── main.tsx
│   └── package.json
├── package.json                  # Root — pnpm workspace config
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** running locally or a remote connection string
- **Redis** (optional for local dev — sessions fall back to in-memory)
- `pnpm` recommended (`npm install -g pnpm`), or use `npm`

### Database Setup

```sql
CREATE DATABASE atomquest;
```

### Backend Setup

```bash
cd backend

# Copy and configure environment variables
cp .env .env.local
# Edit DATABASE_URL, JWT_SECRET, REFRESH_TOKEN_SECRET in .env.local

npm install

# Apply database migrations
npm run db:migrate

# Seed demo users (Employee, Manager, Admin)
npm run db:seed

# Start dev server
npm run dev
# → http://localhost:4000
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
# → http://localhost:5173
```

> The frontend proxies `/api` requests to `localhost:4000` via Vite's dev proxy config.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin / HR | admin@company.com | Admin@123 |
| Manager (L1) | manager@company.com | Manager@123 |
| Employee | employee@company.com | Employee@123 |

The seed script also creates a second employee assigned to the manager, so you can demo the team view and shared goals without additional setup.

---

## Architecture

### Goal Sheet State Machine

```
                  ┌──────────────────┐
                  │      DRAFT       │  ← Employee creating goals
                  └────────┬─────────┘
                           │ submit
                  ┌────────▼─────────┐
                  │    SUBMITTED     │  ← Awaiting manager review
                  └────┬────────┬────┘
           approve     │        │  request rework
                  ┌────▼──┐  ┌──▼──────┐
                  │APPROVED│  │ REWORK  │  ← Employee edits, resubmits
                  └────────┘  └─────────┘
```

- Once `APPROVED`, the `guardApprovedSheet` middleware blocks all goal writes
- Admin can issue an override token to unlock a specific sheet for correction (logged to audit trail)

### RBAC Matrix

| Action | Employee | Manager | Admin |
|---|:---:|:---:|:---:|
| Create / edit own goals (pre-submission) | ✅ | ✅ | ✅ |
| Submit goal sheet | ✅ | ✅ | ✅ |
| Approve / request rework | ❌ | ✅ | ✅ |
| View team goal sheets | ❌ | ✅ | ✅ |
| Inline-edit targets/weightage during approval | ❌ | ✅ | ✅ |
| Add check-in comments | ❌ | ✅ | ✅ |
| Log quarterly actuals | ✅ | ✅ | ✅ |
| Override approved sheet | ❌ | ❌ | ✅ |
| Configure cycle windows | ❌ | ❌ | ✅ |
| Export achievement report | ❌ | ✅ | ✅ |
| View audit trail | ❌ | ❌ | ✅ |

### Scoring Engine

Located at `backend/src/services/scoring.service.ts`.

Pure function — takes `{ uomType, target, actual }`, returns a score between 0 and 1.
Runs **server-side only** so the same logic applies uniformly to the UI display, report exports, and analytics.

| UoM Type | Description | Formula |
|---|---|---|
| `MIN` (Numeric / %) | Higher is better — e.g., Sales Revenue | `achievement ÷ target` |
| `MAX` (Numeric / %) | Lower is better — e.g., TAT, Cost | `target ÷ achievement` |
| `TIMELINE` | Date-based completion | `completion date vs. deadline` |
| `ZERO` | Zero = success — e.g., Safety incidents | `if 0 → 100%, else 0%` |

Edge cases handled: zero denominators, null actuals (score treated as 0), and timeline goals without a recorded completion date.

### Weightage Validation

Enforced at two layers:

1. **API layer** — `goal.controller.ts` recalculates total weightage before every create/update and rejects with `400` if the total would exceed or fall below 100%, or if a single goal's weightage drops below 10%.
2. **Frontend layer** — a live weightage meter shows the running total; the submit button is disabled and the meter turns red if validation fails, preventing unnecessary round-trips.

### Shared Goals

When a Manager or Admin pushes a departmental KPI (`isShared: true`) to multiple employees:

- The Goal Title and Target are **read-only** for recipients
- Recipients may only adjust their individual weightage
- When the primary owner (`sharedOwnerId`) logs an actual, the `logActual` service fans out the update atomically using `Promise.all` upserts across all linked goal records — no recipient needs to enter actuals manually

### Cycle Windows

The `CycleService` determines the currently active period from the admin-configured dates stored in the `cycles` table:

| Period | Window Opens | Action |
|---|---|---|
| Phase 1 — Goal Setting | 1 May | Goal creation, submission & approval |
| Q1 Check-in | July | Progress update — Planned vs. Actual |
| Q2 Check-in | October | Progress update — Planned vs. Actual |
| Q3 Check-in | January | Progress update — Planned vs. Actual |
| Q4 / Annual | March / April | Final achievement capture |

Employees cannot log actuals outside the active quarter window. Admin users bypass cycle gates via a config flag.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Body | Auth |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | Public |
| POST | `/auth/refresh` | `{ refreshToken }` | Public |
| POST | `/auth/logout` | — | Any |

### Goal Sheets

| Method | Path | Auth |
|---|---|---|
| POST | `/sheets` | Employee+ |
| GET | `/sheets` | Any (own sheets) |
| GET | `/sheets/team` | Manager+ |
| GET | `/sheets/:id` | Owner / Manager |
| PATCH | `/sheets/:id/status` | RBAC-gated |
| GET | `/sheets/:id/score` | Any |

### Goals

| Method | Path | Auth |
|---|---|---|
| POST | `/sheets/:id/goals` | Employee (sheet owner) |
| PATCH | `/goals/:id` | Owner (pre-approval) or Admin override |
| DELETE | `/goals/:id` | Owner (pre-approval) |
| POST | `/goals/:id/actuals` | Owner (within active quarter) |

### Check-in Comments

| Method | Path | Auth |
|---|---|---|
| POST | `/sheets/:id/comments` | Manager+ |
| GET | `/sheets/:id/comments` | Any |

### Admin

| Method | Path | Auth |
|---|---|---|
| GET | `/admin/audit-log` | Admin |
| POST | `/admin/sheets/:id/unlock` | Admin |
| GET | `/admin/cycles` | Admin |
| PATCH | `/admin/cycles/:id` | Admin |
| POST | `/admin/shared-goals` | Admin / Manager |

### Reports

| Method | Path | Auth |
|---|---|---|
| GET | `/reports/achievement?format=csv` | Manager+ |
| GET | `/reports/completion` | Manager+ |

---

## BRD Compliance Checklist

### Phase 1 — Goal Creation & Approval

- [x] Employee interface: Thrust Area, Goal Title/Description, UoM, Target, Weightage
- [x] Total weightage = 100% enforced (API + frontend)
- [x] Minimum weightage per goal: 10%
- [x] Maximum 8 goals per employee per cycle
- [x] Manager (L1) inline approval with target/weightage editing
- [x] Goals locked on approval; Admin override to unlock
- [x] Shared Goals: push departmental KPI; recipient adjusts weightage only; actuals sync from owner

### Phase 2 — Achievement Tracking & Check-ins

- [x] Quarterly update interface — Actual vs Planned
- [x] Per-goal status: Not Started / On Track / Completed
- [x] Manager check-in module with structured comments
- [x] System-computed progress scores for all 4 UoM types
- [x] Quarterly window enforcement via CycleService

### Reporting & Governance

- [x] Achievement report — CSV/Excel export, Planned vs Actual
- [x] Completion dashboard — real-time check-in status
- [x] Audit trail — post-lock changes logged with actor, timestamp, JSONB diff

### User Roles

- [x] Employee: create/edit pre-submission, view locked goals, log actuals
- [x] Manager (L1): team dashboard, inline editing, check-in comments
- [x] Admin / HR: cycle management, audit log, goal unlock capability

---

## Environment Variables

Create `backend/.env.local` from `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/atomquest"

# Auth
JWT_SECRET="your-jwt-secret-min-32-chars"
REFRESH_TOKEN_SECRET="your-refresh-secret-min-32-chars"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# Redis (optional — omit to use in-memory sessions)
REDIS_URL="redis://localhost:6379"

# App
PORT=4000
NODE_ENV=development

# Admin override token (used to bypass approved-sheet guard)
ADMIN_OVERRIDE_SECRET="your-admin-override-secret"
```

---

## Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo users and sample data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run test` | Run Vitest unit tests (scoring engine, validation logic) |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |

---

## Evaluation Criteria Coverage

| # | Criterion | How it's addressed |
|---|---|---|
| 1 | **Functionality** | Full Employee → Manager → Admin journeys work end-to-end; all three roles seeded and demoed |
| 2 | **Adherence to BRD** | All Phase 1 & 2 must-haves implemented; validation rules enforced at API and DB level |
| 3 | **User Friendliness** | Wizard-style goal creation, live weightage meter, role-specific dashboards, helpful inline error messages |
| 4 | **Presence of Bugs** | Edge cases handled in scoring engine; optimistic UI with rollback via React Query; TypeScript end-to-end |
| 5 | **Good-to-Have Features** | Audit trail, shared goals sync, exportable reports — escalation and Teams integration scaffolded |
| 6 | **Cost Optimisation** | Single-container deployment (Railway free tier); Redis optional; server-side report generation avoids fat client; Prisma query batching |

---

## License

MIT
