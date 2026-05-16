import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';

// ── Types ──────────────────────────────────────────────────────────────────
type RoleKey = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

// ── Data ───────────────────────────────────────────────────────────────────
const ROLES: { key: RoleKey; icon: string; title: string; tagline: string; color: string; bg: string; border: string }[] = [
  {
    key: 'EMPLOYEE', icon: '👤', title: 'Employee',
    tagline: 'Sets personal goals, tracks quarterly progress',
    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    key: 'MANAGER', icon: '👥', title: 'Manager',
    tagline: 'Reviews team goals, approves sheets, coaches via check-ins',
    color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe',
  },
  {
    key: 'ADMIN', icon: '⚙️', title: 'Admin',
    tagline: 'Configures cycles & escalations, manages users, audits everything',
    color: '#7e22ce', bg: '#fdf4ff', border: '#e9d5ff',
  },
];

const LIFECYCLE = [
  { status: 'DRAFT',      label: 'Draft',      color: '#64748b', bg: '#f1f5f9', desc: 'Employee creates a sheet and adds goals.'                         },
  { status: 'SUBMITTED',  label: 'Submitted',  color: '#d97706', bg: '#fffbeb', desc: 'Employee submits. Manager is notified to review.'                 },
  { status: 'REWORK',     label: 'Rework',     color: '#dc2626', bg: '#fef2f2', desc: 'Manager requests changes. Employee revises and resubmits.'        },
  { status: 'APPROVED',   label: 'Approved',   color: '#059669', bg: '#ecfdf5', desc: 'Manager approves. Employee can now log quarterly actuals.'        },
  { status: 'COMPLETED',  label: 'Completed',  color: '#4f46e5', bg: '#eef2ff', desc: 'All quarters logged. Final scores are calculated automatically.'  },
];

const ROLE_STEPS: Record<RoleKey, { icon: string; title: string; detail: string; link?: string; linkLabel?: string }[]> = {
  EMPLOYEE: [
    { icon: '1', title: 'Go to "My Goals"',         detail: 'Click My Goals in the top nav. This is your personal dashboard.',                          link: '/my-goals',  linkLabel: 'Open My Goals'     },
    { icon: '2', title: 'Create a Goal Sheet',       detail: 'Click "New Goal Sheet" and select the current cycle year (e.g. 2026). One sheet per year.' },
    { icon: '3', title: 'Add your Goals',            detail: 'Click "+ Add Goal". Fill in: goal title, unit of measure (UOM), target value, and weightage. All goal weightages must add up to 100%.' },
    { icon: '4', title: 'Submit for Approval',       detail: 'Once all goals are added and weightage totals 100, click "Submit". Your manager is notified.' },
    { icon: '5', title: 'Log Quarterly Actuals',     detail: 'After your sheet is Approved, click any Q1–Q4 cell in the table and enter your actual value for that quarter. Do this at the end of each quarter.' },
    { icon: '6', title: 'Track your Score',          detail: 'The score bar shows your weighted achievement percentage. Green = 80%+, Yellow = 50–79%, Red = below 50.' },
  ],
  MANAGER: [
    { icon: '1', title: 'Open "Team"',               detail: 'Click Team in the nav. You\'ll see all sheets submitted by your direct reports.',            link: '/team',      linkLabel: 'Open Team'         },
    { icon: '2', title: 'Review a Submitted Sheet',  detail: 'Click "Review" on any Submitted sheet. Check each goal\'s title, UOM, target, and weightage.' },
    { icon: '3', title: 'Approve or Request Rework', detail: 'Click "Approve" to unlock quarterly logging for that employee. Click "Request Rework" if changes are needed — add a note explaining what to fix.' },
    { icon: '4', title: 'Add Quarterly Check-ins',   detail: 'Open an Approved sheet → go to the Comments tab. Write mid-quarter coaching notes (e.g. "Q2: on track, keep going").' },
    { icon: '5', title: 'View Analytics',            detail: 'Click Analytics to see quarter-on-quarter trends, a completion heatmap, and UOM breakdowns for your team.', link: '/analytics', linkLabel: 'Open Analytics' },
  ],
  ADMIN: [
    { icon: '1', title: 'Configure the Goal Cycle',  detail: 'Admin → Cycle Config. Set the current year and when each quarter starts (month numbers). This controls when employees can log actuals.',  link: '/admin', linkLabel: 'Open Admin' },
    { icon: '2', title: 'Set Escalation Rules',      detail: 'Admin → Escalation Rules. Define automatic alerts — e.g. "notify manager if goal not submitted after 30 days".' },
    { icon: '3', title: 'Unlock Sheets for Edits',   detail: 'If an approved sheet needs post-approval edits, Admin can unlock it with a justification and expiry time.' },
    { icon: '4', title: 'View All Users',            detail: 'Admin → Users lists every user, their role, and email. Use this to verify access.' },
    { icon: '5', title: 'Audit Trail',               detail: 'Go to Audit Trail to see a timestamped log of every action — goal edits, status changes, unlocks.',  link: '/audit', linkLabel: 'Open Audit Trail' },
    { icon: '6', title: 'Company-wide Analytics',    detail: 'Analytics gives you completion heatmaps, escalation logs, and UOM breakdowns across all teams.', link: '/analytics', linkLabel: 'Open Analytics' },
  ],
};

const GLOSSARY = [
  { term: 'Goal Sheet',    def: 'A container for all your goals in a given year. One per employee per cycle year.'           },
  { term: 'UOM',           def: 'Unit of Measure — what you\'re counting (e.g. "Projects", "Revenue $K", "% completion").' },
  { term: 'Target',        def: 'The number you\'re aiming for by end-of-year.'                                             },
  { term: 'Actual',        def: 'What you really achieved. Entered quarterly (Q1–Q4).'                                      },
  { term: 'Weightage',     def: 'How important a goal is relative to others. All goals must total 100%.'                    },
  { term: 'Score',         def: 'Actual ÷ Target × 100, weighted across all goals. Shown as a percentage.'                  },
  { term: 'Cycle',         def: 'A calendar year performance period configured by the Admin.'                                },
  { term: 'Check-in',      def: 'A quarterly comment added by a Manager to coach an employee.'                              },
  { term: 'Escalation',    def: 'An automatic alert triggered when an action is overdue (e.g. not submitted).'              },
  { term: 'Audit Trail',   def: 'A permanent log of who changed what and when — visible only to Admins.'                   },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' };
const sectionTitle = (text: string) => (
  <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>{text}</h2>
);

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HelpPage() {
  const { user } = useAuth();
  const [activeRole, setActiveRole] = useState<RoleKey>((user?.role as RoleKey) ?? 'EMPLOYEE');
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const steps = ROLE_STEPS[activeRole];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.25rem 3rem' }}>

      {/* ── Hero ── */}
      <div style={{ ...card, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Getting Started</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.5rem', letterSpacing: '-0.025em' }}>How AtomQuest Works</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6, maxWidth: '480px' }}>
            AtomQuest helps your company set, track, and measure goals every quarter. Employees write goals → managers approve → everyone logs actuals → scores are calculated automatically.
          </p>
        </div>
        <div style={{ fontSize: '4rem', flexShrink: 0 }}>🎯</div>
      </div>

      {/* ── 3 Roles ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        {sectionTitle('The Three Roles')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
          {ROLES.map((r) => (
            <div key={r.key} style={{ ...card, borderColor: r.border, background: r.bg, display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.125rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: r.color }}>{r.title}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0, lineHeight: 1.55 }}>{r.tagline}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Goal Lifecycle ── */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        {sectionTitle('Goal Sheet Lifecycle')}
        <p style={{ fontSize: '0.8375rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
          Every goal sheet moves through these stages. The arrows show who triggers each transition.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '0.375rem' }}>
          {LIFECYCLE.map((step, i) => (
            <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.625rem 0.875rem', borderRadius: '10px', background: step.bg, border: `1.5px solid ${step.color}30`, minWidth: '120px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: step.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{step.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              {i < LIFECYCLE.length - 1 && (
                <div style={{ color: '#c7d2fe', fontSize: '1.25rem', fontWeight: 300, padding: '0 0.125rem' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step-by-Step Guide ── */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.125rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Step-by-Step Guide</h2>
          <div style={{ display: 'flex', gap: '0.375rem', background: '#f8fafc', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {ROLES.map((r) => (
              <button key={r.key} onClick={() => setActiveRole(r.key)}
                style={{ padding: '0.35rem 0.875rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  background: activeRole === r.key ? r.bg : 'transparent',
                  color: activeRole === r.key ? r.color : '#64748b',
                  boxShadow: activeRole === r.key ? `0 0 0 1.5px ${r.border}` : 'none',
                }}>
                {r.icon} {r.title}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 1.125rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '0.1rem' }}>
                {step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.3rem' }}>{step.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>{step.detail}</div>
                {step.link && (
                  <Link to={step.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem', fontSize: '0.775rem', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
                    {step.linkLabel} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Flow Diagram ── */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        {sectionTitle('How Data Flows')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
          {[
            { actor: '⚙️ Admin',    action: 'Configures cycle (year & quarter dates)',      arrow: '↓' },
            { actor: '👤 Employee', action: 'Creates goal sheet → adds goals with targets',  arrow: '↓' },
            { actor: '👤 Employee', action: 'Submits sheet for manager review',              arrow: '↓' },
            { actor: '👥 Manager',  action: 'Approves sheet (or sends back for rework)',     arrow: '↓' },
            { actor: '👤 Employee', action: 'Logs quarterly actuals (Q1–Q4)',                arrow: '↓' },
            { actor: '🤖 System',   action: 'Auto-calculates weighted scores',               arrow: '↓' },
            { actor: '👥 Manager',  action: 'Reviews scores & adds check-in comments',       arrow: '↓' },
            { actor: '⚙️ Admin',    action: 'Views audit trail, analytics & escalations',    arrow: ''  },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '9px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.2rem' }}>{row.actor}</div>
                <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>{row.action}</div>
              </div>
              {row.arrow && <div style={{ fontSize: '1rem', color: '#c7d2fe' }}>{row.arrow}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Glossary ── */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        <button onClick={() => setGlossaryOpen(!glossaryOpen)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Key Terms Glossary</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, transition: 'transform 0.2s', transform: glossaryOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
        </button>

        {glossaryOpen && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.625rem' }}>
            {GLOSSARY.map((g) => (
              <div key={g.term} style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.2rem' }}>{g.term}</div>
                <div style={{ fontSize: '0.775rem', color: '#475569', lineHeight: 1.55 }}>{g.def}</div>
              </div>
            ))}
          </div>
        )}

        {!glossaryOpen && (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.625rem 0 0' }}>
            Click to expand — UOM, Weightage, Score, Escalation, and more explained in plain language.
          </p>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ ...card }}>
        {sectionTitle('Quick Actions')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
          {[
            { label: 'My Goals',    to: '/my-goals',  show: true,                                           icon: '🎯' },
            { label: 'Team',        to: '/team',       show: user?.role !== 'EMPLOYEE',                      icon: '👥' },
            { label: 'Analytics',   to: '/analytics',  show: user?.role !== 'EMPLOYEE',                      icon: '📊' },
            { label: 'Admin Panel', to: '/admin',       show: user?.role === 'ADMIN',                        icon: '⚙️' },
            { label: 'Audit Trail', to: '/audit',       show: user?.role === 'ADMIN',                        icon: '📋' },
          ].filter((a) => a.show).map((a) => (
            <Link key={a.to} to={a.to}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4338ca', fontSize: '0.8375rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.13s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#e0e7ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#eef2ff'; }}
            >
              <span>{a.icon}</span>{a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
