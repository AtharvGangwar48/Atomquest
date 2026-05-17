import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { signup as apiSignup } from '../api';
import { useAuth } from '../store/auth';
import ThreeBackground from '../components/ThreeBackground';
import BugReportButton from '../components/BugReportButton';
import Robot3D from '../components/Robot3D';

// ── Schemas ────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().optional(),
});

const step2Schema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ── Shared input style ─────────────────────────────────────────────────────
const inpStyle: React.CSSProperties = {
  width: '100%', background: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.875rem',
  color: '#0f172a', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' };
const errStyle: React.CSSProperties = { color: '#dc2626', fontSize: '0.75rem', marginTop: '0.3rem' };
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  (e.target as HTMLElement).style.borderColor = '#4f46e5';
  (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  (e.target as HTMLElement).style.borderColor = '#e2e8f0';
  (e.target as HTMLElement).style.boxShadow = 'none';
};

const INDUSTRIES = ['Technology', 'Finance & Banking', 'Healthcare', 'Retail & E-Commerce', 'Manufacturing', 'Education', 'Consulting', 'Media & Entertainment', 'Logistics & Supply Chain', 'Other'];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const color = score === 0 ? '#e2e8f0' : score === 1 ? '#dc2626' : score === 2 ? '#d97706' : '#059669';
  const label = score === 0 ? '' : score === 1 ? 'Weak' : score === 2 ? 'Fair' : 'Strong';

  if (!password) return null;
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.35rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= score ? color : '#f1f5f9', transition: 'background 0.2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label && <span style={{ fontSize: '0.7rem', fontWeight: 600, color }}>{label}</span>}
        <div style={{ display: 'flex', gap: '0.625rem', marginLeft: 'auto' }}>
          {checks.map((c) => (
            <span key={c.label} style={{ fontSize: '0.65rem', color: c.pass ? '#059669' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>{c.pass ? '✓' : '○'}</span>{c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Company Info ───────────────────────────────────────────────────
function Step1({ onNext }: { onNext: (d: Step1Data) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  return (
    <form onSubmit={handleSubmit(onNext)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eef2ff', border: '2px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🏢</div>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Your Company</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Tell us about the organisation you're setting up.</p>
          </div>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Company Name *</label>
        <input {...register('companyName')} placeholder="Acme Corporation" style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
        {errors.companyName && <p style={errStyle}>{errors.companyName.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>Industry <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
        <select {...register('industry')} style={inpStyle} onFocus={onFocus} onBlur={onBlur}>
          <option value="">Select industry…</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <p style={{ fontSize: '0.8rem', color: '#166534', margin: 0, lineHeight: 1.55 }}>
          <strong>You'll be the Admin.</strong> After signing up you can invite managers and employees, configure goal cycles, and manage the full portal.
        </p>
      </div>

      <button type="submit" className="btn-primary" style={{ fontSize: '0.9375rem', padding: '0.7rem' }}>
        Continue →
      </button>
    </form>
  );
}

// ── Step 2: Admin Account ──────────────────────────────────────────────────
function Step2({ companyName, onBack, onSubmit, isLoading, error }: {
  companyName: string;
  onBack: () => void;
  onSubmit: (d: Step2Data) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const pw = watch('password', '');

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eef2ff', border: '2px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>👤</div>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Admin Account</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Create your administrator login for <strong style={{ color: '#4f46e5' }}>{companyName}</strong>.</p>
          </div>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Full Name *</label>
        <input {...register('name')} placeholder="Jane Smith" style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
        {errors.name && <p style={errStyle}>{errors.name.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>Work Email *</label>
        <input {...register('email')} type="email" placeholder="jane@acmecorp.com" style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
        {errors.email && <p style={errStyle}>{errors.email.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>Password *</label>
        <input {...register('password')} type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number" style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
        {errors.password && <p style={errStyle}>{errors.password.message}</p>}
        <PasswordStrength password={pw} />
      </div>

      <div>
        <label style={labelStyle}>Confirm Password *</label>
        <input {...register('confirmPassword')} type="password" placeholder="Repeat password" style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
        {errors.confirmPassword && <p style={errStyle}>{errors.confirmPassword.message}</p>}
      </div>

      {isLoading && (
        <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', background: '#fef9e7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <span>First signup may take 30-60 seconds as server wakes up. Please wait...</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
        <button type="button" onClick={onBack} className="btn-ghost" style={{ flex: '0 0 auto', fontSize: '0.875rem' }}>← Back</button>
        <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1, fontSize: '0.9375rem', padding: '0.7rem' }}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Creating account…
            </span>
          ) : 'Create Account'}
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}

// ── Step 3: Success ────────────────────────────────────────────────────────
function StepSuccess({ companyName, name }: { companyName: string; name: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2rem' }}>
        ✓
      </div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>You're all set!</h2>
      <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
        Welcome, <strong>{name}</strong>! <strong style={{ color: '#4f46e5' }}>{companyName}</strong>'s AtomQuest portal is ready. You've been set up as the Admin.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {[
          ['⚙️', 'Configure your 2026 goal cycle in Admin → Cycle Config'],
          ['👥', 'Invite your team by sharing this portal URL'],
          ['🎯', 'Set up goal thrust areas and weightage guidelines'],
        ].map(([icon, text]) => (
          <div key={String(text)} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.625rem 0.875rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
            <span style={{ fontSize: '1.1rem' }}>{icon}</span>
            <span style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>

      <Link to="/admin" className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '0.7rem', fontSize: '0.9375rem', borderRadius: '8px', textDecoration: 'none' }}>
        Go to Admin Panel →
      </Link>
      <Link to="/my-goals" style={{ display: 'block', marginTop: '0.625rem', fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>
        Skip to My Goals
      </Link>
    </div>
  );
}

// ── Main SignupPage ────────────────────────────────────────────────────────
const STEPS = ['Company', 'Account', 'Done'];

export default function SignupPage() {
  const { setTokens } = useAuth();
  const [step, setStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ companyName: string; name: string } | null>(null);

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setStep(1);
  };

  const handleStep2 = async (data: Step2Data) => {
    if (!step1Data) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await apiSignup({
        companyName: step1Data.companyName,
        industry: step1Data.industry,
        name: data.name,
        email: data.email,
        password: data.password,
      });
      setTokens(res.accessToken, res.refreshToken, res.user);
      setSuccessData({ companyName: step1Data.companyName, name: data.name });
      setStep(2);
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        setApiError('Server is waking up. Please wait 30 seconds and try again.');
      } else if (typeof msg === 'string') {
        setApiError(msg);
      } else {
        setApiError('Signup failed. This email may already be in use.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <ThreeBackground />
      <BugReportButton />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '900px', display: 'flex', alignItems: 'center', gap: '3rem', animation: 'fadeIn 0.4s ease-out' }}>

        <div className="robot-panel" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Robot3D page="signup" />
        </div>

        <div style={{ flex: 1, minWidth: 0, maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', justifyContent: 'center', marginBottom: '0.625rem' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="sgLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4f46e5"/>
                  <stop offset="100%" stopColor="#7c3aed"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="9" fill="url(#sgLogoGrad)"/>
              <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
              <line x1="16" y1="4" x2="16" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="23" x2="16" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4" y1="16" x2="9" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="23" y1="16" x2="28" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>AtomQuest</div>
              <div style={{ fontSize: '0.6rem', color: '#4f46e5', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Goals Portal</div>
            </div>
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>Set up your company</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>Free to start · No credit card needed</p>
        </div>

        {/* Step tracker */}
        {step < 2 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem', gap: '0.375rem' }}>
            {STEPS.slice(0, 2).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                  background: i < step ? '#4f46e5' : i === step ? '#4f46e5' : '#f1f5f9',
                  color: i <= step ? 'white' : '#94a3b8',
                  boxShadow: i === step ? '0 0 0 4px rgba(79,70,229,0.12)' : 'none',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: i === step ? 600 : 400, color: i === step ? '#4f46e5' : '#94a3b8' }}>{s}</span>
                {i < 1 && <div style={{ flex: 1, height: '2px', background: i < step ? '#4f46e5' : '#f1f5f9', borderRadius: '1px', margin: '0 0.25rem' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {step === 0 && <Step1 onNext={handleStep1} />}
          {step === 1 && step1Data && (
            <Step2
              companyName={step1Data.companyName}
              onBack={() => setStep(0)}
              onSubmit={handleStep2}
              isLoading={isLoading}
              error={apiError}
            />
          )}
          {step === 2 && successData && (
            <StepSuccess companyName={successData.companyName} name={successData.name} />
          )}
        </div>

        {/* Footer link */}
        {step < 2 && (
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#94a3b8', marginTop: '1.25rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        )}

        <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.75rem', marginTop: '1rem' }}>
          © {new Date().getFullYear()} AtomQuest · Enterprise Goal Management
        </p>
        </div>
      </div>
    </div>
  );
}
