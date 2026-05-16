import { Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';
import ThreeBackground from './ThreeBackground';
import Footer from './Footer';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading…</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  const navLinks = [
    { to: '/my-goals',  label: 'My Goals',   roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { to: '/team',      label: 'Team',        roles: ['MANAGER', 'ADMIN'] },
    { to: '/analytics', label: 'Analytics',   roles: ['MANAGER', 'ADMIN'] },
    { to: '/admin',     label: 'Admin',       roles: ['ADMIN'] },
    { to: '/audit',     label: 'Audit Trail', roles: ['ADMIN'] },
  ].filter((l) => l.roles.includes(user.role));

  const roleStyle: Record<string, { bg: string; color: string; border: string }> = {
    EMPLOYEE: { bg: 'rgba(6,182,212,0.12)',  color: '#67e8f9', border: 'rgba(6,182,212,0.35)' },
    MANAGER:  { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: 'rgba(99,102,241,0.35)' },
    ADMIN:    { bg: 'rgba(236,72,153,0.12)', color: '#f9a8d4', border: 'rgba(236,72,153,0.35)' },
  };
  const rs = roleStyle[user.role] ?? roleStyle.EMPLOYEE;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <ThreeBackground />

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8, 12, 24, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Three-column grid: logo | center links | user */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', height: '60px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>

          {/* Left — Logo */}
          <Link to="/my-goals" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            {/* SVG Logo mark */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#06b6d4"/>
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
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1, letterSpacing: '-0.01em' }}>AtomQuest</div>
              <div style={{ fontSize: '0.6rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Goals Portal</div>
            </div>
          </Link>

          {/* Center — Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {navLinks.map((l) => {
              const active = pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '0.4rem 0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#c7d2fe' : '#94a3b8',
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#c7d2fe'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right — User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user.name[0].toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{user.name}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{user.email}</span>
              </div>
            </div>

            {/* Role badge */}
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
              {user.role}
            </span>

            {/* Sign out */}
            <button
              onClick={logout}
              style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.35rem 0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fca5a5'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
