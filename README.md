# AtomQuest — Goal Setting & Tracking Portal

Built for **AtomQuest Hackathon 1.0** by Atharv Gangwar.

The problem: most companies still track employee goals in spreadsheets and email threads. Managers can't see what's happening in real time, employees don't know how their work connects to company priorities, and HR is stuck piecing things together at appraisal time. This portal fixes that.

---

## Screenshots

### Login
![Login](./images/login_page.png)

### Employee — My Goals
![Employee Goals](./images/employe_goals.png)

### Manager View
| Team Sheets | Analytics |
|---|---|
| ![Manager Team](./images/manager_team.png) | ![Manager Analytics](./images/manager_analytics.png) |

### Admin Panel
| Dashboard | Analytics |
|---|---|
| ![Admin Team](./images/admin_team.png) | ![Admin Analytics](./images/admin_analytics.png) |

![Audit Trail](./images/admin_auditTrail.png)

### User Guide
![Guide](./images/guide.png)

---

## What it does

**Goal creation & approval**
- Employees create a goal sheet per year with up to 8 goals
- Each goal has a thrust area, target, unit of measurement, and weightage — must total 100%
- Manager reviews, can edit inline, then approves or sends back for rework
- Approved goals are locked; admin can unlock with a justification

**Quarterly tracking**
- Once approved, employees log actuals each quarter (Q1–Q4)
- System auto-calculates scores based on scoring type (MAX / MIN / TIMELINE / ZERO)
- Managers add check-in comments per quarter

**Reporting & audit**
- Admin exports achievement reports as Excel
- Full audit trail — every change logged with old/new values, who made it, and when
- Analytics: QoQ trend charts, completion heatmaps, goal distribution pies
- Escalation rules: auto-reminders if goals aren't submitted/approved within N days

---

## Tech stack

| Layer | What |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Three.js |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (access + refresh tokens), bcrypt, optional Azure SSO |
| Deployment | Vercel (frontend), Railway (backend + DB) |

---

## Running locally

**Prerequisites:** Node.js 18+, PostgreSQL

```bash
# Clone and install
git clone <repo-url>

# Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run dev            # http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

---

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@company.com | Admin@123 |
| Manager | manager@company.com | Manager@123 |
| Employee | employee@company.com | Employee@123 |

---

## Project structure

```
Atomquest/
├── frontend/
│   └── src/
│       ├── pages/        # MyGoals, Team, Analytics, Admin, Audit, Help, Scoring
│       ├── components/   # Layout, Footer, PageHero, ThreeBackground, GoalWizard…
│       ├── api/          # Axios client + typed API calls
│       └── store/        # Auth context, cycle context
│
└── backend/
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    └── src/
        ├── controllers/
        ├── services/
        ├── middleware/   # JWT auth, RBAC guards
        └── routes/
```

---

## Scoring types

| Type | When to use | Formula |
|---|---|---|
| MAX | Higher is better (sales, revenue) | actual ÷ target |
| MIN | Lower is better (defects, cost) | 100% if actual ≤ target, decreases otherwise |
| TIMELINE | Deadline-based | 100% if on time, -3.3% per day late |
| ZERO | Zero tolerance (safety incidents) | 100% if 0, else 0% |

Final score = weighted average across all goals.

---

## RBAC

| Action | Employee | Manager | Admin |
|---|:---:|:---:|:---:|
| Create/edit own goals | ✅ | ✅ | ✅ |
| Submit goal sheet | ✅ | ✅ | ✅ |
| Approve / request rework | ❌ | ✅ | ✅ |
| View team sheets | ❌ | ✅ | ✅ |
| Add check-in comments | ❌ | ✅ | ✅ |
| Log quarterly actuals | ✅ | ✅ | ✅ |
| Unlock approved sheet | ❌ | ❌ | ✅ |
| Configure cycle windows | ❌ | ❌ | ✅ |
| Export reports | ❌ | ✅ | ✅ |
| View audit trail | ❌ | ❌ | ✅ |

---

## Environment variables

**backend/.env**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/atomquest"
JWT_SECRET="min-32-chars"
REFRESH_TOKEN_SECRET="min-32-chars"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
PORT=4000
NODE_ENV=development
```

**frontend/.env** (optional — for social links and Azure SSO)
```env
VITE_API_URL=http://localhost:4000/api
VITE_GITHUB_URL=https://github.com/yourusername/atomquest
VITE_LINKEDIN_URL=https://linkedin.com/in/yourprofile
VITE_TWITTER_URL=https://twitter.com/yourhandle
VITE_INSTAGRAM_URL=https://instagram.com/yourhandle
VITE_LINKTREE_URL=https://linktr.ee/yourhandle
VITE_LEETCODE_URL=https://leetcode.com/yourhandle
VITE_UNSTOP_URL=https://unstop.com/u/yourhandle
VITE_EMAIL=you@example.com
```

---

Built with ❤️ for AtomQuest Hackathon 1.0 — Atharv Gangwar
