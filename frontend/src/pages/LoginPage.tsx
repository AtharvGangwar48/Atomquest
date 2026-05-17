import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api';
import api from '../api/client';
import { useAuth } from '../store/auth';
import { msalConfig, loginRequest, isAzureConfigured } from '../config/msalConfig';
import type { AuthTokens } from '../types';
import ThreeBackground from '../components/ThreeBackground';
import BugReportButton from '../components/BugReportButton';
import Robot3D from '../components/Robot3D';
import logoImg from '../assets/hero.png';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

const DEMO = [
  { role: 'Employee', email: 'employee@company.com', pass: 'Employee@123', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { role: 'Manager',  email: 'manager@company.com',  pass: 'Manager@123',  color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
  { role: 'Admin',    email: 'admin@company.com',    pass: 'Admin@123',    color: '#7e22ce', bg: '#fdf4ff', border: '#e9d5ff' },
];

export default function LoginPage() {
  const { setTokens } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiLogin(data.email, data.password);
      setTokens(res.accessToken, res.refreshToken, res.user);
      navigate(res.user.role === 'EMPLOYEE' ? '/my-goals' : '/team');
    } catch (err: any) {
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        setError('root', { message: 'Server is waking up. Please wait 30 seconds and try again.' });
      } else {
        setError('root', { message: 'Invalid credentials. Please try again.' });
      }
    }
  };

  const handleAzureSSO = async () => {
    try {
      const { PublicClientApplication } = await import('@azure/msal-browser');
      const msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();
      const result = await msalInstance.loginPopup(loginRequest);
      const { data } = await api.post<AuthTokens>('/auth/azure', { accessToken: result.accessToken });
      setTokens(data.accessToken, data.refreshToken, data.user);
      navigate(data.user.role === 'EMPLOYEE' ? '/my-goals' : '/team');
    } catch (err) {
      console.error('[SSO]', err);
      setError('root', { message: 'Azure SSO failed. Try email/password login.' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <ThreeBackground />
      <BugReportButton />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '900px', display: 'flex', alignItems: 'center', gap: '3rem', animation: 'fadeIn 0.4s ease-out' }}>

        <div className="robot-panel" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Robot3D page="login" />
        </div>

        <div style={{ flex: 1, minWidth: 0, maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', width: '70px', height: '70px', borderRadius: '20px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.25)', padding: '6px' }}>
            <img src={logoImg} alt="AtomQuest" style={{ width: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>AtomQuest</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Goal Setting & Tracking Portal</p>
        </div>

        {/* Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* Azure SSO */}
          {isAzureConfigured && (
            <>
              <button type="button" onClick={handleAzureSSO}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.65rem 1rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', marginBottom: '1.25rem', fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#ffffff'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
              >
                <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                Sign in with Microsoft
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Email</label>
              <input {...register('email')} type="email" className="input-dark" placeholder="you@company.com" />
              {errors.email && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.3rem' }}>{errors.email.message}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Password</label>
              <input {...register('password')} type="password" className="input-dark" placeholder="••••••••" />
              {errors.password && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.3rem' }}>{errors.password.message}</p>}
            </div>
            {isSubmitting && (
              <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', background: '#fef9e7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span>First login may take 30-60 seconds as server wakes up. Please wait...</span>
              </div>
            )}
            {errors.root && (
              <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 500 }}>
                {errors.root.message}
              </div>
            )}
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.7rem', marginTop: '0.125rem', fontSize: '0.9rem' }}>
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Signup CTA */}
          <div style={{ marginTop: '1.25rem', padding: '0.875rem 1rem', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3730a3', margin: 0 }}>New organisation?</p>
              <p style={{ fontSize: '0.75rem', color: '#6d28d9', margin: '0.15rem 0 0' }}>Set up your company in 2 minutes.</p>
            </div>
            <Link to="/signup" style={{ flexShrink: 0, padding: '0.45rem 0.875rem', borderRadius: '7px', background: '#4f46e5', color: 'white', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s' }}>
              Create account →
            </Link>
          </div>

          {/* Demo credentials */}
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem', margin: '0 0 0.625rem' }}>Demo Credentials</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {DEMO.map(({ role, email, pass, color, bg, border }) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.625rem', borderRadius: '7px', background: bg, border: `1px solid ${border}` }}>
                  <span style={{ color, fontSize: '0.75rem', fontWeight: 700 }}>{role}</span>
                  <span style={{ color: '#64748b', fontSize: '0.7rem', fontFamily: 'monospace' }}>{email} / {pass}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          © {new Date().getFullYear()} AtomQuest · Enterprise Goal Management
        </p>
        </div>
      </div>
    </div>
  );
}
