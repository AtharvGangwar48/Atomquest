import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';

// ── Types ──────────────────────────────────────────────────────────────────
type RoleKey = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

// ── Data ───────────────────────────────────────────────────────────────────
const ROLES: { key: RoleKey; icon: string; title: string; tagline: string; color: string; bg: string; border: string }[] = [
  {
    key: 'EMPLOYEE', icon: '👤', title: 'Employee',
    tagline: 'Create goals and track your progress',
    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    key: 'MANAGER', icon: '👥', title: 'Manager',
    tagline: 'Review and approve your team\'s goals',
    color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe',
  },
  {
    key: 'ADMIN', icon: '⚙️', title: 'Admin',
    tagline: 'Manage settings and view reports',
    color: '#7e22ce', bg: '#fdf4ff', border: '#e9d5ff',
  },
];

const LIFECYCLE = [
  { status: 'DRAFT',      label: 'Draft',      color: '#64748b', bg: '#f1f5f9', desc: 'You are creating your goals.'                         },
  { status: 'SUBMITTED',  label: 'Submitted',  color: '#d97706', bg: '#fffbeb', desc: 'Waiting for manager to review.'                 },
  { status: 'REWORK',     label: 'Rework',     color: '#dc2626', bg: '#fef2f2', desc: 'Manager asked for changes. Edit and resubmit.'        },
  { status: 'APPROVED',   label: 'Approved',   color: '#059669', bg: '#ecfdf5', desc: 'Approved! Now you can add quarterly progress.'        },
  { status: 'COMPLETED',  label: 'Completed',  color: '#4f46e5', bg: '#eef2ff', desc: 'All quarters done. Your score is ready.'  },
];

const ROLE_STEPS: Record<RoleKey, { icon: string; title: string; detail: string; link?: string; linkLabel?: string }[]> = {
  EMPLOYEE: [
    { icon: '1', title: 'Open "My Goals"',         detail: 'Click on "My Goals" in the top menu. This is your main page.',                          link: '/my-goals',  linkLabel: 'Go to My Goals'     },
    { icon: '2', title: 'Start Your Goals',       detail: 'Click "Start Goals" button and select the year (like 2026). You create one sheet per year.' },
    { icon: '3', title: 'Add Goals',            detail: 'Click "+ Add Goal". Fill in: goal name, target number, and percentage (must total 100%).' },
    { icon: '4', title: 'Submit to Manager',       detail: 'When all goals add up to 100%, click "Submit for Approval". Your manager will get notified.' },
    { icon: '5', title: 'Update Each Quarter',     detail: 'After approval, click on Q1, Q2, Q3, or Q4 boxes to enter what you actually achieved that quarter.' },
    { icon: '6', title: 'Check Your Score',          detail: 'The colored bar shows your performance. Green = Great (80%+), Yellow = Good (50-79%), Red = Needs Work.' },
  ],
  MANAGER: [
    { icon: '1', title: 'Open "Team"',               detail: 'Click "Team" in the menu. You will see all goal sheets from your team members.',            link: '/team',      linkLabel: 'Go to Team'         },
    { icon: '2', title: 'Review Submitted Goals',  detail: 'Click "Review" on any submitted sheet. Check if the goals make sense and add up to 100%.' },
    { icon: '3', title: 'Approve or Send Back', detail: 'Click "Approve" if everything looks good. Click "Rework" if changes are needed (add a note explaining why).' },
    { icon: '4', title: 'Add Comments',   detail: 'Open an approved sheet and go to Comments tab. Write feedback for each quarter to help your team.' },
    { icon: '5', title: 'View Team Progress',            detail: 'Click "Analytics" to see charts and progress reports for your entire team.', link: '/analytics', linkLabel: 'Go to Analytics' },
  ],
  ADMIN: [
    { icon: '1', title: 'Set Up the Year',  detail: 'Go to Admin → Cycle Config. Choose the year and set when each quarter starts (month numbers).',  link: '/admin', linkLabel: 'Go to Admin' },
    { icon: '2', title: 'Set Reminders',      detail: 'Admin → Escalation Rules. Set up automatic reminders (like "remind manager if not approved in 30 days").' },
    { icon: '3', title: 'Unlock if Needed',   detail: 'If someone needs to edit an approved goal, you can unlock it temporarily with a reason.' },
    { icon: '4', title: 'Manage Users',            detail: 'Admin → Users shows everyone in the system with their roles and emails.' },
    { icon: '5', title: 'Check History',               detail: 'Go to Audit Trail to see every change made - who did what and when.',  link: '/audit', linkLabel: 'Go to Audit Trail' },
    { icon: '6', title: 'View All Reports',    detail: 'Analytics shows company-wide progress, completion rates, and performance charts.', link: '/analytics', linkLabel: 'Go to Analytics' },
  ],
};

const GLOSSARY = [
  { term: 'Goal Sheet',    def: 'A collection of all your goals for one year. You create one sheet per year.'           },
  { term: 'Goal',           def: 'Something you want to achieve this year (like "Increase sales" or "Complete 10 projects").' },
  { term: 'Target',        def: 'The number you are trying to reach by end of year.'                                             },
  { term: 'Actual',        def: 'What you really achieved. You enter this every quarter (Q1, Q2, Q3, Q4).'                                      },
  { term: 'Percentage',     def: 'How important each goal is. All your goals must add up to 100%.'                    },
  { term: 'Score',         def: 'Your performance shown as a percentage. Higher is better!'                  },
  { term: 'Quarter',         def: 'A 3-month period. Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec.'                                },
  { term: 'Check-in',      def: 'A comment your manager adds to give you feedback.'                              },
  { term: 'Approved',    def: 'Your manager said your goals look good. Now you can start tracking progress.'              },
  { term: 'Rework',   def: 'Your manager wants you to make changes before approving.'                   },
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
            AtomQuest helps you set goals, get them approved, and track progress every quarter. Simple and easy!
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
          Every goal sheet goes through these steps. Click on each to see what happens.
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
            { actor: '⚙️ Admin',    action: 'Sets up the year and quarters',      arrow: '↓' },
            { actor: '👤 Employee', action: 'Creates goals with targets',  arrow: '↓' },
            { actor: '👤 Employee', action: 'Submits to manager',              arrow: '↓' },
            { actor: '👥 Manager',  action: 'Reviews and approves',     arrow: '↓' },
            { actor: '👤 Employee', action: 'Updates progress each quarter',                arrow: '↓' },
            { actor: '🤖 System',   action: 'Calculates your score automatically',               arrow: '↓' },
            { actor: '👥 Manager',  action: 'Adds feedback comments',       arrow: '↓' },
            { actor: '⚙️ Admin',    action: 'Views reports and history',    arrow: ''  },
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
            Click to see simple explanations of common terms.
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
