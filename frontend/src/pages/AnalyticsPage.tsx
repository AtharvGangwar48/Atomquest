import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getQoQTrends, getCompletionHeatmap, getUomBreakdown, getEscalationLogs, listEscalationRules, upsertEscalationRule, deleteEscalationRule } from '../api';
import type { EscalationRule, HeatmapRow } from '../types';

const COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: '8px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem',
  color: '#0f172a', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#374151',
  marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em',
};
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  (e.target as HTMLElement).style.borderColor = '#4f46e5';
  (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
};
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  (e.target as HTMLElement).style.borderColor = '#e2e8f0';
  (e.target as HTMLElement).style.boxShadow = 'none';
};

const HEAT = [
  { min: 0,  max: 40,  bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  { min: 40, max: 70,  bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  { min: 70, max: 101, bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
];
function heatStyle(score: number | undefined) {
  if (score === undefined) return { bg: '#f8fafc', color: '#cbd5e1', border: '#f1f5f9' };
  return HEAT.find((r) => score >= r.min && score < r.max) ?? HEAT[2];
}

const tooltipStyle = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#0f172a', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };

function QoQChart({ cycleYear }: { cycleYear: number }) {
  const { data } = useQuery({ queryKey: ['qoq', cycleYear], queryFn: () => getQoQTrends(cycleYear) });
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>Quarter-on-Quarter Score Trend</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data?.trends ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}%`, 'Avg Score']} />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#64748b' }} />
          <Line type="monotone" dataKey="avgScore" name="Avg Score %" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#7c3aed' }} />
        </LineChart>
      </ResponsiveContainer>
      {data && <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'right', marginTop: '0.5rem', margin: '0.5rem 0 0' }}>Based on {Math.max(0, ...data.trends.map((t) => t.count))} approved sheets</p>}
    </div>
  );
}

function CompletionHeatmap({ cycleYear }: { cycleYear: number }) {
  const { data } = useQuery({ queryKey: ['heatmap', cycleYear], queryFn: () => getCompletionHeatmap(cycleYear) });
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>Completion Heatmap by Thrust Area</p>
      {!data?.heatmap.length ? (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No data available yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.5rem 0.875rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thrust Area</th>
                {quarters.map((q) => <th key={q} style={{ padding: '0.5rem 0.875rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.heatmap.map((row: HeatmapRow) => (
                <tr key={row.thrustArea} style={{ borderBottom: '1px solid #f8fafc' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafbff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '0.5rem 0.875rem', fontWeight: 600, color: '#475569', fontSize: '0.8125rem' }}>{row.thrustArea}</td>
                  {quarters.map((q) => {
                    const score = row[q];
                    const hs = heatStyle(score);
                    return (
                      <td key={q} style={{ padding: '0.5rem 0.875rem', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: hs.bg, color: hs.color, border: `1px solid ${hs.border}` }}>
                          {score !== undefined ? `${score}%` : '—'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PieSection({ cycleYear }: { cycleYear: number }) {
  const { data } = useQuery({ queryKey: ['uom', cycleYear], queryFn: () => getUomBreakdown(cycleYear) });
  if (!data) return null;
  const charts = [{ title: 'UoM Distribution', slices: data.uomBreakdown }, { title: 'Scoring Type', slices: data.scoringBreakdown }, { title: 'Goal Status', slices: data.statusBreakdown }];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      {charts.map(({ title, slices }) => (
        <div key={title} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>{title}</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} labelLine={false}
                label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
                {slices.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v), 'Goals']} />
            </PieChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>{data.totalGoals} total goals</p>
        </div>
      ))}
    </div>
  );
}

const num = () => z.coerce.number();
const ruleSchema = z.object({
  name: z.string().min(1),
  triggerEvent: z.enum(['GOAL_NOT_SUBMITTED', 'APPROVAL_PENDING', 'ACTUAL_NOT_LOGGED']),
  thresholdDays: num().refine((v) => v >= 1 && v <= 365, 'Must be 1–365'),
  notifyRole: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  isActive: z.boolean(),
});
type RuleForm = z.infer<typeof ruleSchema>;

function EscalationRulesSection() {
  const qc = useQueryClient();
  const { data: rules = [] } = useQuery({ queryKey: ['escalationRules'], queryFn: listEscalationRules });
  const { data: logs = [] } = useQuery({ queryKey: ['escalationLogs'], queryFn: getEscalationLogs });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { triggerEvent: 'GOAL_NOT_SUBMITTED', thresholdDays: 7, notifyRole: 'MANAGER', isActive: true },
  });
  const upsertMutation = useMutation({ mutationFn: (d: RuleForm) => upsertEscalationRule(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['escalationRules'] }); reset(); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteEscalationRule(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['escalationRules'] }) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.125rem', margin: '0 0 1.125rem' }}>Add / Update Rule</p>
          <form onSubmit={handleSubmit((d) => upsertMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Rule Name</label>
              <input {...register('name')} style={inputStyle} onFocus={focus} onBlur={blur} />
              {errors.name && <p style={{ color: '#dc2626', fontSize: '0.65rem', marginTop: '0.2rem' }}>{errors.name.message}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label style={labelStyle}>Trigger Event</label>
                <select {...register('triggerEvent')} style={inputStyle} onFocus={focus} onBlur={blur}>
                  <option value="GOAL_NOT_SUBMITTED">Goal Not Submitted</option>
                  <option value="APPROVAL_PENDING">Approval Pending</option>
                  <option value="ACTUAL_NOT_LOGGED">Actual Not Logged</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Threshold (days)</label>
                <input {...register('thresholdDays')} type="number" min={1} max={365} style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label style={labelStyle}>Notify Role</label>
                <select {...register('notifyRole')} style={inputStyle} onFocus={focus} onBlur={blur}>
                  {['EMPLOYEE','MANAGER','ADMIN'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#475569', cursor: 'pointer' }}>
                  <input {...register('isActive')} type="checkbox" style={{ accentColor: '#4f46e5', width: '14px', height: '14px' }} />
                  Active
                </label>
              </div>
            </div>
            <button type="submit" disabled={upsertMutation.isPending} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
              {upsertMutation.isPending ? 'Saving…' : 'Save Rule'}
            </button>
          </form>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.125rem', margin: '0 0 1.125rem' }}>Active Rules <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 400 }}>({rules.length})</span></p>
          {rules.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No rules configured yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(rules as EscalationRule[]).map((rule) => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', transition: 'border-color 0.13s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                >
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{rule.name}</p>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0.15rem 0 0' }}>{rule.triggerEvent} · {rule.thresholdDays}d · {rule.notifyRole}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '999px', background: rule.isActive ? '#ecfdf5' : '#f1f5f9', color: rule.isActive ? '#047857' : '#64748b', border: `1px solid ${rule.isActive ? '#a7f3d0' : '#e2e8f0'}` }}>
                      {rule.isActive ? 'Active' : 'Off'}
                    </span>
                    <button onClick={() => deleteMutation.mutate(rule.id)} style={{ fontSize: '0.7rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.875rem', margin: '0 0 0.875rem' }}>Recent Escalations <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 400 }}>({logs.length})</span></p>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {logs.map((log) => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.625rem 0.875rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#b45309' }}>{log.user.name}</span>
                  <span style={{ color: '#d1d5db', margin: '0 0.4rem', fontSize: '0.75rem' }}>·</span>
                  <span style={{ fontSize: '0.775rem', color: '#475569' }}>{log.message}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '0.75rem' }}>{new Date(log.sentAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [cycleYear, setCycleYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState<'charts' | 'escalation'>('charts');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 className="page-header">Analytics</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select value={cycleYear} onChange={(e) => setCycleYear(Number(e.target.value))}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#0f172a', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
          </select>
          <div style={{ display: 'flex', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '0.2rem', gap: '0.125rem' }}>
            {(['charts', 'escalation'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '0.35rem 0.875rem', fontSize: '0.8rem', fontWeight: 500, textTransform: 'capitalize', background: tab === t ? '#ffffff' : 'transparent', color: tab === t ? '#4f46e5' : '#64748b', border: tab === t ? '1px solid #e2e8f0' : '1px solid transparent', borderRadius: '7px', cursor: 'pointer', transition: 'all 0.13s', fontFamily: 'inherit', boxShadow: tab === t ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                {t === 'charts' ? 'Charts' : 'Escalation'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'charts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <QoQChart cycleYear={cycleYear} />
          <CompletionHeatmap cycleYear={cycleYear} />
          <PieSection cycleYear={cycleYear} />
        </div>
      ) : <EscalationRulesSection />}
    </div>
  );
}
