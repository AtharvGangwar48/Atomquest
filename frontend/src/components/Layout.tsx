import { Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';
import ThreeBackground from './ThreeBackground';
import Footer from './Footer';
import BugReportButton from './BugReportButton';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>Loading…</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  const navLinks = [
    { to: '/my-goals',  label: 'My Goals',   roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { to: '/team',      label: 'Team',        roles: ['MANAGER', 'ADMIN'] },
    { to: '/analytics', label: 'Analytics',   roles: ['MANAGER', 'ADMIN'] },
    { to: '/admin',     label: 'Admin',       roles: ['ADMIN'] },
    { to: '/audit',     label: 'Audit Trail', roles: ['ADMIN'] },
    { to: '/help',      label: '? Guide',     roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  ].filter((l) => l.roles.includes(user.role));

  const rolePill: Record<string, { bg: string; color: string; border: string }> = {
    EMPLOYEE: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    MANAGER:  { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
    ADMIN:    { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  };
  const rp = rolePill[user.role] ?? rolePill.EMPLOYEE;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <ThreeBackground />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', height: '58px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>

          {/* Left — Logo */}
          <Link to="/my-goals" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4f46e5"/>
                  <stop offset="100%" stopColor="#7c3aed"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="9" fill="url(#logoGrad)"/>
              <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
              <line x1="16" y1="4" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4" y1="16" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.02em' }}>AtomQuest</div>
              <div style={{ fontSize: '0.6rem', color: '#4f46e5', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Goals Portal</div>
            </div>
          </Link>

          {/* Center — Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
            {navLinks.map((l) => {
              const active = pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '0.375rem 0.875rem',
                    borderRadius: '7px',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#4f46e5' : '#475569',
                    background: active ? '#eef2ff' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.13s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#4f46e5'; (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#475569'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right — User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user.name[0].toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{user.name}</span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{user.email}</span>
              </div>
            </div>

            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: rp.bg, color: rp.color, border: `1px solid ${rp.border}`, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
              {user.role}
            </span>

            <button
              onClick={logout}
              style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.35rem 0.75rem', borderRadius: '7px', background: 'transparent', border: '1px solid #e2e8f0', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.13s', flexShrink: 0, fontFamily: 'inherit' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#dc2626'; (e.currentTarget as HTMLElement).style.borderColor = '#fecaca'; (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main style={{ position: 'relative', zIndex: 10, flex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Outlet />
      </main>

      <Footer />
      <BugReportButton />
    </div>
  );
}
