import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getDashboard, downloadAchievementReport, upsertCycleConfig, getCycleConfigs, unlockSheet, getTeamSheets } from '../api';
import type { DashboardEmployee, GoalSheet } from '../types';
import StatusBadge from '../components/StatusBadge';
import PageHero from '../components/PageHero';

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: '8px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem',
  color: '#0f172a', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#374151',
  marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em',
};
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  (e.target as HTMLElement).style.borderColor = '#4f46e5';
  (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
};
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  (e.target as HTMLElement).style.borderColor = '#e2e8f0';
  (e.target as HTMLElement).style.boxShadow = 'none';
};

const num = () => z.coerce.number();
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const cycleSchema = z.object({
  cycleYear: num().refine((v) => v >= 2020 && v <= 2100, 'Invalid year'),
  goalSettingStart: num().refine((v) => v >= 1 && v <= 12, 'Must be 1–12'),
  q1Start: num().refine((v) => v >= 1 && v <= 12, 'Must be 1–12'),
  q2Start: num().refine((v) => v >= 1 && v <= 12, 'Must be 1–12'),
  q3Start: num().refine((v) => v >= 1 && v <= 12, 'Must be 1–12'),
  q4Start: num().refine((v) => v >= 1 && v <= 12, 'Must be 1–12'),
});
type CycleForm = z.infer<typeof cycleSchema>;

function CycleConfigSection() {
  const qc = useQueryClient();
  const { data: configs = [] } = useQuery({ queryKey: ['cycleConfigs'], queryFn: getCycleConfigs });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CycleForm>({
    resolver: zodResolver(cycleSchema),
    defaultValues: { cycleYear: new Date().getFullYear(), goalSettingStart: 1, q1Start: 1, q2Start: 4, q3Start: 7, q4Start: 10 },
  });
  const mutation = useMutation({
    mutationFn: (data: CycleForm) => upsertCycleConfig(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cycleConfigs'] }); qc.invalidateQueries({ queryKey: ['cycle'] }); },
  });

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem' }}>Cycle Configuration</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
          {[['Cycle Year','cycleYear'],['Goal Setting (month)','goalSettingStart'],['Q1 Start','q1Start'],['Q2 Start','q2Start'],['Q3 Start','q3Start'],['Q4 Start','q4Start']].map(([label, key]) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input {...register(key as keyof CycleForm)} type="number" style={inputStyle} onFocus={focus} onBlur={blur} />
              {errors[key as keyof CycleForm] && <p style={{ color: '#dc2626', fontSize: '0.65rem', marginTop: '0.2rem' }}>{errors[key as keyof CycleForm]?.message}</p>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
            {mutation.isPending ? 'Saving…' : 'Save Config'}
          </button>
          {mutation.isSuccess && <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>✓ Saved</span>}
        </div>
      </form>

      {configs.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>Existing Configs <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#cbd5e1' }}>— click row to load</span></p>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Year','Goal Setting','Q1','Q2','Q3','Q4'].map((h) => <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(configs as CycleForm[]).map((c) => (
                  <tr key={c.cycleYear} style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.13s' }} onClick={() => reset(c)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafbff'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>{c.cycleYear}</td>
                    {[c.goalSettingStart, c.q1Start, c.q2Start, c.q3Start, c.q4Start].map((v, i) => <td key={i} style={{ padding: '0.5rem 0.75rem', color: '#475569' }}>{MONTH_NAMES[v]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function UnlockModal({ sheet, onClose }: { sheet: GoalSheet; onClose: () => void }) {
  const qc = useQueryClient();
  const [justification, setJustification] = useState('');
  const [hours, setHours] = useState(24);
  const mutation = useMutation({
    mutationFn: () => unlockSheet(sheet.id, justification, hours),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teamSheets'] }); onClose(); },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', animation: 'fadeIn 0.2s ease-out' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>Unlock Sheet for Editing</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.25rem' }}><span style={{ color: '#0f172a', fontWeight: 600 }}>{sheet.employee?.name}</span> — {sheet.cycleYear}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Justification *</label>
            <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3}
              placeholder="Reason for unlocking this approved sheet…"
              style={{ ...inputStyle, resize: 'none' }} onFocus={focus} onBlur={blur} />
            {justification.length > 0 && justification.length < 10 && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.25rem' }}>Must be at least 10 characters</p>}
          </div>
          <div>
            <label style={labelStyle}>Unlock Duration (hours)</label>
            <input type="number" min={1} max={168} value={hours} onChange={(e) => setHours(Number(e.target.value))} style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          {mutation.isError && <p style={{ color: '#dc2626', fontSize: '0.8rem' }}>Failed to unlock sheet.</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} className="btn-ghost" style={{ fontSize: '0.8rem' }}>Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={justification.length < 10 || mutation.isPending}
              style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '8px', background: justification.length >= 10 ? '#d97706' : '#f3f4f6', color: justification.length >= 10 ? 'white' : '#9ca3af', border: 'none', cursor: justification.length >= 10 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.13s' }}>
              {mutation.isPending ? 'Unlocking…' : 'Unlock Sheet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSection() {
  const [cycleYear, setCycleYear] = useState(new Date().getFullYear());
  const [unlockSheet_, setUnlockSheet] = useState<GoalSheet | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { data: dashboard, isLoading } = useQuery({ queryKey: ['dashboard', cycleYear], queryFn: () => getDashboard(cycleYear) });
  const { data: allSheets = [] } = useQuery({ queryKey: ['teamSheets'], queryFn: getTeamSheets });

  const handleExport = async () => {
    setDownloading(true);
    try {
      const blob = await downloadAchievementReport(cycleYear);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `achievement-report-${cycleYear}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  };

  const statCards = dashboard ? [
    { label: 'Employees',    value: dashboard.totals.totalEmployees,  color: '#0f172a',  bg: '#f8fafc', border: '#e2e8f0' },
    { label: 'Approved',     value: dashboard.totals.sheetsApproved,  color: '#059669',  bg: '#ecfdf5', border: '#a7f3d0' },
    { label: 'Submitted',    value: dashboard.totals.sheetsSubmitted, color: '#4338ca',  bg: '#eef2ff', border: '#c7d2fe' },
    { label: 'Draft / Rework',value: dashboard.totals.sheetsDraft,    color: '#d97706',  bg: '#fffbeb', border: '#fde68a' },
    { label: 'Avg Score',    value: `${dashboard.totals.avgScore}%`,  color: '#1d4ed8',  bg: '#eff6ff', border: '#bfdbfe' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Completion Dashboard</h2>
          <select value={cycleYear} onChange={(e) => setCycleYear(Number(e.target.value))}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#0f172a', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={handleExport} disabled={downloading} className="btn-success" style={{ fontSize: '0.8125rem' }}>
          {downloading ? 'Generating…' : '↓ Export Excel'}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.875rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 0.7s linear infinite' }} />
          Loading…
        </div>
      ) : dashboard ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {statCards.map(({ label, value, color, bg, border }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '1.1rem', textAlign: 'center', transition: 'all 0.13s' }}>
                <div style={{ fontSize: '1.875rem', fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Employee','Status','Goals','Completed','On Track','Avg Score','Actions'].map((h) => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboard.employees.map((emp: DashboardEmployee) => {
                    const sheet = allSheets.find((s) => s.id === emp.sheetId);
                    const scoreColor = emp.avgScore >= 80 ? '#059669' : emp.avgScore >= 50 ? '#d97706' : '#dc2626';
                    const scoreBg = emp.avgScore >= 80 ? '#ecfdf5' : emp.avgScore >= 50 ? '#fffbeb' : '#fef2f2';
                    return (
                      <tr key={emp.employeeId} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.13s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafbff'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8125rem' }}>{emp.employeeName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{emp.employeeEmail}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={emp.sheetStatus} /></td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#475569' }}>{emp.totalGoals}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#059669' }}>{emp.completed}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#4338ca' }}>{emp.onTrack}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${emp.avgScore}%`, background: scoreColor, borderRadius: '3px', transition: 'width 0.4s' }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: scoreColor, background: scoreBg, padding: '0.1rem 0.35rem', borderRadius: '4px', minWidth: '2.5rem', textAlign: 'right' }}>{emp.avgScore}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {emp.sheetStatus === 'APPROVED' && sheet && (
                            <button onClick={() => setUnlockSheet(sheet)}
                              style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '6px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.13s' }}>
                              Unlock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
      {unlockSheet_ && <UnlockModal sheet={unlockSheet_} onClose={() => setUnlockSheet(null)} />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHero variant="admin" />
      <h1 className="page-header">Admin Panel</h1>
      <CycleConfigSection />
      <DashboardSection />
    </div>
  );
}
