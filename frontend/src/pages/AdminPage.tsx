import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getDashboard, downloadAchievementReport, upsertCycleConfig, getCycleConfigs, unlockSheet, getTeamSheets } from '../api';
import type { DashboardEmployee, GoalSheet } from '../types';
import StatusBadge from '../components/StatusBadge';

const C = { card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', borderAccent: 'rgba(99,102,241,0.3)', text: '#e2e8f0', sub: '#94a3b8', muted: '#64748b', purple: '#6366f1', green: '#10b981', amber: '#f59e0b', red: '#ef4444', cyan: '#06b6d4' };
const IS = {
  input:  { width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem', color: C.text, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' },
  label:  { display: 'block' as const, fontSize: '0.7rem', fontWeight: 600, color: C.sub, marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
};
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { (e.target as HTMLElement).style.borderColor = C.purple; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { (e.target as HTMLElement).style.borderColor = C.border; (e.target as HTMLElement).style.boxShadow = 'none'; };

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
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, margin: '0 0 1.25rem' }}>Cycle Configuration</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
          {[['Cycle Year','cycleYear'],['Goal Setting (month)','goalSettingStart'],['Q1 Start (month)','q1Start'],['Q2 Start (month)','q2Start'],['Q3 Start (month)','q3Start'],['Q4 Start (month)','q4Start']].map(([label, key]) => (
            <div key={key}>
              <label style={IS.label}>{label}</label>
              <input {...register(key as keyof CycleForm)} type="number" style={IS.input} onFocus={focus} onBlur={blur} />
              {errors[key as keyof CycleForm] && <p style={{ color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem' }}>{errors[key as keyof CycleForm]?.message}</p>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary">{mutation.isPending ? 'Saving…' : 'Save Config'}</button>
          {mutation.isSuccess && <span style={{ fontSize: '0.8rem', color: C.green }}>Saved ✓</span>}
        </div>
      </form>

      {configs.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.625rem' }}>Existing Configs</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Year','Goal Setting','Q1','Q2','Q3','Q4'].map((h) => <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(configs as CycleForm[]).map((c) => (
                  <tr key={c.cycleYear} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, cursor: 'pointer' }} onClick={() => reset(c)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: C.text }}>{c.cycleYear}</td>
                    {[c.goalSettingStart, c.q1Start, c.q2Start, c.q3Start, c.q4Start].map((v, i) => <td key={i} style={{ padding: '0.5rem 0.75rem', color: C.sub }}>{MONTH_NAMES[v]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.65rem', color: C.muted, marginTop: '0.375rem' }}>Click a row to load it into the form.</p>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: 'rgba(13,18,35,0.97)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '18px', width: '100%', maxWidth: '440px', padding: '1.75rem', boxShadow: '0 0 50px rgba(245,158,11,0.1)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, margin: '0 0 0.25rem' }}>Unlock Sheet for Editing</h2>
        <p style={{ fontSize: '0.8rem', color: C.muted, margin: '0 0 1.25rem' }}><span style={{ color: C.sub, fontWeight: 600 }}>{sheet.employee?.name}</span> — {sheet.cycleYear}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={IS.label}>Justification *</label>
            <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3}
              placeholder="Reason for unlocking this approved sheet…"
              style={{ ...IS.input, resize: 'none' }} onFocus={focus} onBlur={blur} />
            {justification.length > 0 && justification.length < 10 && <p style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '0.25rem' }}>Must be at least 10 characters</p>}
          </div>
          <div>
            <label style={IS.label}>Unlock Duration (hours)</label>
            <input type="number" min={1} max={168} value={hours} onChange={(e) => setHours(Number(e.target.value))} style={IS.input} onFocus={focus} onBlur={blur} />
          </div>
          {mutation.isError && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>Failed to unlock sheet.</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
            <button onClick={onClose} style={{ fontSize: '0.8rem', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.75rem' }}>Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={justification.length < 10 || mutation.isPending}
              style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '10px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', border: 'none', cursor: 'pointer', opacity: justification.length < 10 ? 0.5 : 1 }}>
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
    { label: 'Employees',   value: dashboard.totals.totalEmployees,  color: C.text },
    { label: 'Approved',    value: dashboard.totals.sheetsApproved,  color: C.green },
    { label: 'Submitted',   value: dashboard.totals.sheetsSubmitted, color: '#a5b4fc' },
    { label: 'Draft/Rework',value: dashboard.totals.sheetsDraft,     color: C.amber },
    { label: 'Avg Score',   value: `${dashboard.totals.avgScore}%`,  color: C.cyan },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, margin: 0 }}>Completion Dashboard</h2>
          <select value={cycleYear} onChange={(e) => setCycleYear(Number(e.target.value))}
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: C.text, outline: 'none', cursor: 'pointer' }}>
            {[2024, 2025, 2026].map((y) => <option key={y} style={{ background: '#0d1526' }}>{y}</option>)}
          </select>
        </div>
        <button onClick={handleExport} disabled={downloading} className="btn-success" style={{ fontSize: '0.8rem' }}>
          {downloading ? 'Generating…' : '↓ Export Excel'}
        </button>
      </div>

      {isLoading ? <div style={{ color: C.muted, fontSize: '0.875rem' }}>Loading…</div> : dashboard ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {statCards.map(({ label, value, color }) => (
              <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '1.1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: '0.35rem', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.2)' }}>
                    {['Employee','Sheet Status','Goals','Completed','On Track','Avg Score','Actions'].map((h) => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboard.employees.map((emp: DashboardEmployee) => {
                    const sheet = allSheets.find((s) => s.id === emp.sheetId);
                    const scoreColor = emp.avgScore >= 80 ? C.green : emp.avgScore >= 50 ? C.amber : C.red;
                    return (
                      <tr key={emp.employeeId} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: C.text, fontSize: '0.8125rem' }}>{emp.employeeName}</div>
                          <div style={{ fontSize: '0.7rem', color: C.muted }}>{emp.employeeEmail}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}><StatusBadge status={emp.sheetStatus} /></td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: C.sub }}>{emp.totalGoals}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: C.green }}>{emp.completed}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#a5b4fc' }}>{emp.onTrack}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${emp.avgScore}%`, background: scoreColor, borderRadius: '3px', boxShadow: `0 0 6px ${scoreColor}66` }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: scoreColor, width: '2.5rem' }}>{emp.avgScore}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {emp.sheetStatus === 'APPROVED' && sheet && (
                            <button onClick={() => setUnlockSheet(sheet)}
                              style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '6px', background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer' }}>
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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e2e8f0', margin: 0, letterSpacing: '-0.02em' }}>Admin Panel</h1>
      <CycleConfigSection />
      <DashboardSection />
    </div>
  );
}
