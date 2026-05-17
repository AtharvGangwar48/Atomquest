<div align="center">

# 🎯 AtomQuest
### Goal Setting & Tracking Portal

[![AtomQuest Hackathon 1.0](https://img.shields.io/badge/Hackathon-1.0-blue?style=for-the-badge)](https://atomberg.com)
[![Built for Atomberg](https://img.shields.io/badge/Built%20for-Atomberg-orange?style=for-the-badge)](https://atomberg.com)

**A full-stack, role-based web portal for managing employee goals — from creation to quarterly tracking and audit-ready reporting.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Demo](#-demo-credentials) • [Architecture](#-architecture)

</div>

---

## 📸 Screenshots

<div align="center">

### 🔐 Login Portal
<img src="./images/login_page.png" alt="Login Page" width="800"/>

### 👤 Employee Dashboard
<img src="./images/employe_goals.png" alt="Employee Goals" width="800"/>

### 👔 Manager View
<table>
  <tr>
    <td><img src="./images/manager_team.png" alt="Manager Team" width="400"/></td>
    <td><img src="./images/manager_analytics.png" alt="Manager Analytics" width="400"/></td>
  </tr>
</table>

### 🔧 Admin Panel
<table>
  <tr>
    <td><img src="./images/admin_team.png" alt="Admin Team" width="400"/></td>
    <td><img src="./images/admin_analytics.png" alt="Admin Analytics" width="400"/></td>
  </tr>
  <tr>
    <td colspan="2"><img src="./images/admin_auditTrail.png" alt="Audit Trail" width="800"/></td>
  </tr>
</table>

### 📖 User Guide
<img src="./images/guide.png" alt="Guide" width="800"/>

</div>

---

## ✨ Features

### 📝 Phase 1 — Goal Creation & Approval
- ✅ **Employee Interface** — Create Goal Sheets with up to 8 goals per cycle
- 🎯 **Thrust Areas** — Define Goal Title, Description, Unit of Measurement
- 📊 **Smart Validation** — Total weightage = 100%, min 10% per goal
- 👨‍💼 **Manager Approval** — Inline editing, approve or request rework
- 🔒 **Goal Locking** — Approved goals locked, Admin override available
- 🤝 **Shared Goals** — Push departmental KPIs to multiple employees

### 📈 Phase 2 — Achievement Tracking & Check-ins
- 📅 **Quarterly Updates** — Log Actual vs Planned achievements
- 🚦 **Goal Status** — Not Started / On Track / Completed
- 💬 **Manager Check-ins** — Structured comments with audit trail
- 🧮 **Auto Scoring** — System-computed progress scores
- ⏰ **Cycle Windows** — Quarterly update windows with enforcement

### 📊 Reporting & Governance
- 📥 **Achievement Reports** — Exportable CSV/Excel
- 📌 **Completion Dashboard** — Real-time check-in status
- 🔍 **Audit Trail** — Complete change history with timestamps

---

## 🛠 Tech Stack

<div align="center">

| Layer | Technology |
|:---:|:---|
| 🎨 **Frontend** | React 18 • Vite • Tailwind CSS • React Hook Form • Zod • React Query |
| ⚙️ **Backend** | Node.js • Express • TypeScript |
| 🗄️ **Database** | PostgreSQL • Prisma ORM |
| 🔐 **Auth** | JWT • bcrypt • Redis Sessions |
| 📦 **Deployment** | Docker • Railway • Vercel • GitHub Actions |

</div>

---

## 📁 Project Structure

```
atomquest/
├── 🎨 frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Employee/     # Goal sheet, quarterly update
│   │   │   ├── Manager/      # Team dashboard, approval, check-in
│   │   │   └── Admin/        # Cycle config, audit log, reports
│   │   ├── components/       # Shared UI components
│   │   └── hooks/            # React Query hooks
│   └── package.json
│
├── ⚙️ backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # Migration history
│   │   └── seed.ts           # Demo data seeder
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, RBAC, guards
│   │   ├── services/         # Business logic
│   │   └── routes/           # API routes
│   └── package.json
│
└── 📸 images/                # Screenshots
```

---

## 🚀 Getting Started

### 📋 Prerequisites

```bash
Node.js 18+
PostgreSQL
Redis (optional)
pnpm (recommended)
```

### 🗄️ Database Setup

```sql
CREATE DATABASE atomquest;
```

### ⚙️ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env .env.local
# Edit DATABASE_URL, JWT_SECRET in .env.local

# Run migrations
npm run db:migrate

# Seed demo users
npm run db:seed

# Start server
npm run dev
# → http://localhost:4000
```

### 🎨 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|:---:|:---|:---|
| 🔧 **Admin** | admin@company.com | Admin@123 |
| 👔 **Manager** | manager@company.com | Manager@123 |
| 👤 **Employee** | employee@company.com | Employee@123 |

---

## 🏗 Architecture

### 🔄 Goal Sheet State Machine

```
┌──────────────────┐
│      DRAFT       │  ← Employee creating goals
└────────┬─────────┘
         │ submit
┌────────▼─────────┐
│    SUBMITTED     │  ← Awaiting manager review
└────┬────────┬────┘
     │        │
approve      request rework
     │        │
┌────▼──┐  ┌──▼──────┐
│APPROVED│  │ REWORK  │  ← Employee edits, resubmits
└────────┘  └─────────┘
```

### 🔐 RBAC Matrix

| Action | 👤 Employee | 👔 Manager | 🔧 Admin |
|:---|:---:|:---:|:---:|
| Create/edit own goals | ✅ | ✅ | ✅ |
| Submit goal sheet | ✅ | ✅ | ✅ |
| Approve/request rework | ❌ | ✅ | ✅ |
| View team goal sheets | ❌ | ✅ | ✅ |
| Inline-edit during approval | ❌ | ✅ | ✅ |
| Add check-in comments | ❌ | ✅ | ✅ |
| Log quarterly actuals | ✅ | ✅ | ✅ |
| Override approved sheet | ❌ | ❌ | ✅ |
| Configure cycle windows | ❌ | ❌ | ✅ |
| Export reports | ❌ | ✅ | ✅ |
| View audit trail | ❌ | ❌ | ✅ |

### 🧮 Scoring Engine

| UoM Type | Description | Formula |
|:---|:---|:---|
| 📈 **MIN** | Higher is better (Sales, Revenue) | `achievement ÷ target` |
| 📉 **MAX** | Lower is better (TAT, Cost) | `target ÷ achievement` |
| 📅 **TIMELINE** | Date-based completion | `completion date vs deadline` |
| 🎯 **ZERO** | Zero = success (Safety incidents) | `if 0 → 100%, else 0%` |

### ⚖️ Weightage Validation

- ✅ Total weightage must equal **100%**
- ✅ Minimum per goal: **10%**
- ✅ Maximum goals: **8 per cycle**
- ✅ Real-time validation in UI
- ✅ API-level enforcement

### 🤝 Shared Goals

- 📌 Manager/Admin pushes departmental KPIs
- 🔒 Title and Target are read-only for recipients
- ⚖️ Recipients adjust weightage only
- 🔄 Actuals sync automatically from primary owner

### 📅 Cycle Windows

| Period | Opens | Action |
|:---|:---|:---|
| 🎯 **Goal Setting** | May 1 | Create, submit & approve |
| 📊 **Q1 Check-in** | July | Progress update |
| 📊 **Q2 Check-in** | October | Progress update |
| 📊 **Q3 Check-in** | January | Progress update |
| 📊 **Q4 / Annual** | March/April | Final achievement |

---

## 🔌 API Reference

All endpoints prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### 🔐 Auth

| Method | Path | Auth |
|:---|:---|:---:|
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Public |
| POST | `/auth/logout` | Any |

### 📝 Goal Sheets

| Method | Path | Auth |
|:---|:---|:---:|
| POST | `/sheets` | Employee+ |
| GET | `/sheets` | Any |
| GET | `/sheets/team` | Manager+ |
| GET | `/sheets/:id` | Owner/Manager |
| PATCH | `/sheets/:id/status` | RBAC |

### 🎯 Goals

| Method | Path | Auth |
|:---|:---|:---:|
| POST | `/sheets/:id/goals` | Owner |
| PATCH | `/goals/:id` | Owner/Admin |
| DELETE | `/goals/:id` | Owner |
| POST | `/goals/:id/actuals` | Owner |

### 💬 Check-in Comments

| Method | Path | Auth |
|:---|:---|:---:|
| POST | `/sheets/:id/comments` | Manager+ |
| GET | `/sheets/:id/comments` | Any |

### 🔧 Admin

| Method | Path | Auth |
|:---|:---|:---:|
| GET | `/admin/audit-log` | Admin |
| POST | `/admin/sheets/:id/unlock` | Admin |
| GET | `/admin/cycles` | Admin |
| PATCH | `/admin/cycles/:id` | Admin |

### 📊 Reports

| Method | Path | Auth |
|:---|:---|:---:|
| GET | `/reports/achievement?format=csv` | Manager+ |
| GET | `/reports/completion` | Manager+ |

---

## ✅ BRD Compliance Checklist

### Phase 1 — Goal Creation & Approval
- [x] Employee interface with Thrust Area, UoM, Target, Weightage
- [x] Total weightage = 100% enforced
- [x] Minimum 10% per goal, maximum 8 goals
- [x] Manager inline approval with editing
- [x] Goals locked on approval
- [x] Shared Goals with automatic sync

### Phase 2 — Achievement Tracking
- [x] Quarterly update interface
- [x] Per-goal status tracking
- [x] Manager check-in module
- [x] System-computed progress scores
- [x] Quarterly window enforcement

### Reporting & Governance
- [x] Achievement report (CSV/Excel)
- [x] Completion dashboard
- [x] Audit trail with JSONB diff

### User Roles
- [x] Employee: create, edit, log actuals
- [x] Manager: team dashboard, approval, check-ins
- [x] Admin: cycle management, audit log, overrides

---

## 🔧 Environment Variables

Create `backend/.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/atomquest"

# Auth
JWT_SECRET="your-jwt-secret-min-32-chars"
REFRESH_TOKEN_SECRET="your-refresh-secret-min-32-chars"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# App
PORT=4000
NODE_ENV=development

# Admin
ADMIN_OVERRIDE_SECRET="your-admin-override-secret"
```

---

## 📜 Scripts

### Backend

| Script | Description |
|:---|:---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run production build |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo users |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run Vitest tests |

### Frontend

| Script | Description |
|:---|:---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |

---

## 🎯 Evaluation Criteria Coverage

| # | Criterion | Implementation |
|:---:|:---|:---|
| 1️⃣ | **Functionality** | Full Employee → Manager → Admin journeys |
| 2️⃣ | **BRD Adherence** | All Phase 1 & 2 requirements implemented |
| 3️⃣ | **User Friendliness** | Wizard-style UI, live validation, role dashboards |
| 4️⃣ | **Bug-Free** | TypeScript end-to-end, edge case handling |
| 5️⃣ | **Good-to-Have** | Audit trail, shared goals, exportable reports |
| 6️⃣ | **Cost Optimization** | Single-container deployment, optional Redis |

---

<div align="center">

### 🏆 Built for AtomQuest Hackathon 1.0

<img src="./images/footer.png" alt="Footer" width="600"/>

**Made with ❤️ for Atomquest**

</div>
