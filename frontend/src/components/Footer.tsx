import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  { to: '/my-goals',  label: 'My Goals' },
  { to: '/team',      label: 'Team Sheets' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/admin',     label: 'Admin Panel' },
  { to: '/audit',     label: 'Audit Trail' },
];

const FEATURES = [
  'Goal Creation & Approval',
  'Quarterly Check-ins',
  'Score Tracking',
  'Analytics & Heatmaps',
  'Excel Reports',
  'Escalation Engine',
];

export default function Footer() {
  return (
    <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid #e2e8f0', background: '#ffffff', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="ftLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4f46e5"/>
                    <stop offset="100%" stopColor="#7c3aed"/>
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="9" fill="url(#ftLogoGrad)"/>
                <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="16" r="2.5" fill="white"/>
                <line x1="16" y1="4" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4" y1="16" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>AtomQuest</div>
                <div style={{ fontSize: '0.6rem', color: '#4f46e5', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Goals Portal</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.65, marginBottom: '1rem' }}>
              Enterprise Goal Setting & Tracking Portal for full lifecycle management.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.375rem 0.625rem', borderRadius: '7px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 5px #059669' }} />
              <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>All Systems Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem', margin: '0 0 0.875rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} style={{ fontSize: '0.8125rem', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.13s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#4f46e5'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                  >
                    <span style={{ color: '#c7d2fe', fontSize: '0.55rem' }}>▸</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem', margin: '0 0 0.875rem' }}>Features</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {FEATURES.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c7d2fe', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem', margin: '0 0 0.875rem' }}>Built With</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {['React 18', 'TypeScript', 'Node.js', 'PostgreSQL', 'Three.js', 'Prisma', 'Vite', 'JWT Auth'].map((t) => (
                <span key={t} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '5px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 500 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.875rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            © {new Date().getFullYear()} AtomQuest · Enterprise Goal Management
          </span>
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500 }}>v4.0.0</span>
        </div>
      </div>
    </footer>
  );
}
