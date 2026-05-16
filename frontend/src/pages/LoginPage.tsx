import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api';
import api from '../api/client';
import { useAuth } from '../store/auth';
import { msalConfig, loginRequest, isAzureConfigured } from '../config/msalConfig';
import type { AuthTokens } from '../types';
import ThreeBackground from '../components/ThreeBackground';
import logoImg from '../assets/hero.png';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { setTokens } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiLogin(data.email, data.password);
      setTokens(res.accessToken, res.refreshToken, res.user);
      navigate(res.user.role === 'EMPLOYEE' ? '/my-goals' : '/team');
    } catch {
      setError('root', { message: 'Invalid credentials' });
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <ThreeBackground />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
            <img
              src={logoImg}
              alt="AtomQuest Logo"
              style={{ width: '90px', height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 0 24px rgba(99,102,241,0.5))' }}
            />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>AtomQuest</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Goal Setting & Tracking Portal</p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding: '2rem' }}>
          {/* Azure SSO */}
          {isAzureConfigured && (
            <>
              <button
                type="button"
                onClick={handleAzureSSO}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.25rem' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
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
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Email</label>
              <input {...register('email')} type="email" className="input-dark" placeholder="you@company.com" />
              {errors.email && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Password</label>
              <input {...register('password')} type="password" className="input-dark" placeholder="••••••••" />
              {errors.password && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password.message}</p>}
            </div>
            {errors.root && (
              <div style={{ padding: '0.6rem 0.875rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.8rem' }}>
                {errors.root.message}
              </div>
            )}
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '0.25rem', padding: '0.75rem' }}>
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: '1.5rem', padding: '0.875rem', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Demo Credentials</p>
            {[
              { role: 'Employee', email: 'employee@company.com', pass: 'Employee@123', color: '#67e8f9' },
              { role: 'Manager',  email: 'manager@company.com',  pass: 'Manager@123',  color: '#a5b4fc' },
              { role: 'Admin',    email: 'admin@company.com',    pass: 'Admin@123',    color: '#f9a8d4' },
            ].map(({ role, email, pass, color }) => (
              <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ color, fontSize: '0.75rem', fontWeight: 600 }}>{role}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'monospace' }}>{email} / {pass}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          © {new Date().getFullYear()} AtomQuest · Enterprise Goal Management
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
