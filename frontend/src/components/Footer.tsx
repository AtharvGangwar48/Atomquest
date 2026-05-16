import { Link } from 'react-router-dom';

const TECH_STACK = [
  { label: 'Frontend', items: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Three.js', 'Recharts'] },
  { label: 'Backend',  items: ['Node.js', 'Express', 'TypeScript', 'Prisma ORM', 'PostgreSQL', 'JWT Auth'] },
  { label: 'Integrations', items: ['Azure AD SSO', 'MS Teams Bot', 'Adaptive Cards', 'ExcelJS Reports', 'node-cron', 'MSAL Browser'] },
];

const PHASES = [
  { label: 'Phase 1', desc: 'Goal Creation & Approval Workflow' },
  { label: 'Phase 2', desc: 'Quarterly Tracking & Check-ins' },
  { label: 'Phase 3', desc: 'Reporting, Governance & Admin' },
  { label: 'Phase 4', desc: 'SSO, Teams, Escalations & Analytics' },
];

const QUICK_LINKS = [
  { to: '/my-goals',  label: 'My Goals' },
  { to: '/team',      label: 'Team Sheets' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/admin',     label: 'Admin Panel' },
  { to: '/audit',     label: 'Audit Trail' },
];

export default function Footer() {
  return (
    <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6, 9, 18, 0.9)', backdropFilter: 'blur(20px)', marginTop: 'auto' }}>

      {/* Main footer grid */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>

          {/* Brand column */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="9" fill="url(#footerLogoGrad)"/>
                <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="16" r="2.5" fill="white"/>
                <line x1="16" y1="4" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4" y1="16" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>AtomQuest</div>
                <div style={{ fontSize: '0.6rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Goals Portal</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Enterprise-grade Goal Setting & Tracking Portal. Full lifecycle management from creation to quarterly check-ins and performance visibility.
            </p>
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', width: 'fit-content' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 600 }}>All Systems Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} style={{ fontSize: '0.8125rem', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#a5b4fc'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                  >
                    <span style={{ color: '#6366f1', fontSize: '0.6rem' }}>▸</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Phases */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Development Phases</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {PHASES.map(({ label, desc }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)', flexShrink: 0, marginTop: '0.05rem' }}>{label}</span>
                  <span style={{ fontSize: '0.775rem', color: '#64748b', lineHeight: 1.4 }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Tech Stack</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {TECH_STACK.map(({ label, items }) => (
                <div key={label}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {items.map((item) => (
                      <span key={item} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#334155' }}>
            © {new Date().getFullYear()} AtomQuest. Enterprise Goal Management Platform.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {['React 18', 'Node.js', 'PostgreSQL', 'Three.js'].map((t) => (
              <span key={t} style={{ fontSize: '0.7rem', color: '#334155' }}>{t}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {['#6366f1', '#06b6d4', '#10b981'].map((c, i) => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: c, animation: `pulse ${1.5 + i * 0.3}s ease-in-out infinite` }} />
            ))}
            <span style={{ fontSize: '0.7rem', color: '#475569', marginLeft: '0.25rem' }}>v4.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
