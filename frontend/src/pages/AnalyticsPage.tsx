import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getQoQTrends, getCompletionHeatmap, getUomBreakdown, getEscalationLogs, listEscalationRules, upsertEscalationRule, deleteEscalationRule } from '../api';
import type { EscalationRule, HeatmapRow } from '../types';

const C = { card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#e2e8f0', sub: '#94a3b8', muted: '#64748b', purple: '#6366f1', cyan: '#06b6d4', green: '#10b981', amber: '#f59e0b', red: '#ef4444' };
const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
const IS = {
  input:  { width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem', color: C.text, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' },
  select: { width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem', color: C.text, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' },
  label:  { display: 'block' as const, fontSize: '0.7rem', fontWeight: 600, color: C.sub, marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
};
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { (e.target as HTMLElement).style.borderColor = C.purple; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { (e.target as HTMLElement).style.borderColor = C.border; (e.target as HTMLElement).style.boxShadow = 'none'; };

const HEAT = [
  { min: 0,  max: 40,  bg: 'rgba(239,68,68,0.15)',   color: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
  { min: 40, max: 70,  bg: 'rgba(245,158,11,0.15)',  color: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  { min: 70, max: 101, bg: 'rgba(16,185,129,0.15)',  color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
];
function heatStyle(score: number | undefined) {
  if (score === undefined) return { bg: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.15)', border: 'transparent' };
  return HEAT.find((r) => score >= r.min && score < r.max) ?? HEAT[2];
}

function QoQChart({ cycleYear }: { cycleYear: number }) {
  const { data } = useQuery({ queryKey: ['qoq', cycleYear], queryFn: () => getQoQTrends(cycleYear) });
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.25rem' }}>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, marginBottom: '1rem' }}>Quarter-on-Quarter Score Trend</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data?.trends ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.border }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={{ background: 'rgba(13,18,35,0.95)', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '0.8rem' }} formatter={(v) => [`${Number(v)}%`, 'Avg Score']} />
          <Legend wrapperStyle={{ fontSize: '0.75rem', color: C.sub }} />
          <Line type="monotone" dataKey="avgScore" name="Avg Score %" stroke={C.purple} strokeWidth={2.5} dot={{ r: 4, fill: C.purple, strokeWidth: 0 }} activeDot={{ r: 6, fill: C.cyan }} />
        </LineChart>
      </ResponsiveContainer>
      {data && <p style={{ fontSize: '0.7rem', color: C.muted, textAlign: 'right', marginTop: '0.5rem' }}>Based on {Math.max(0, ...data.trends.map((t) => t.count))} approved sheets</p>}
    </div>
  );
}

function CompletionHeatmap({ cycleYear }: { cycleYear: number }) {
  const { data } = useQuery({ queryKey: ['heatmap', cycleYear], queryFn: () => getCompletionHeatmap(cycleYear) });
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.25rem' }}>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, marginBottom: '1rem' }}>Completion Heatmap by Thrust Area</p>
      {!data?.heatmap.length ? (
        <p style={{ color: C.muted, fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No data yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thrust Area</th>
                {quarters.map((q) => <th key={q} style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.heatmap.map((row: HeatmapRow) => (
                <tr key={row.thrustArea} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: C.sub, fontSize: '0.775rem' }}>{row.thrustArea}</td>
                  {quarters.map((q) => {
                    const score = row[q];
                    const hs = heatStyle(score);
                    return (
                      <td key={q} style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: hs.bg, color: hs.color, border: `1px solid ${hs.border}` }}>
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
        <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, marginBottom: '0.75rem' }}>{title}</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} labelLine={false} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
                {slices.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(13,18,35,0.95)', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '0.8rem' }} formatter={(v) => [Number(v), 'Goals']} />
            </PieChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '0.7rem', color: C.muted, textAlign: 'center', marginTop: '0.25rem' }}>{data.totalGoals} total goals</p>
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
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, marginBottom: '1rem' }}>Add / Update Rule</p>
          <form onSubmit={handleSubmit((d) => upsertMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div><label style={IS.label}>Rule Name</label><input {...register('name')} style={IS.input} onFocus={focus} onBlur={blur} />{errors.name && <p style={{ color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem' }}>{errors.name.message}</p>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label style={IS.label}>Trigger Event</label>
                <select {...register('triggerEvent')} style={IS.select} onFocus={focus} onBlur={blur}>
                  <option value="GOAL_NOT_SUBMITTED" style={{ background: '#0d1526' }}>Goal Not Submitted</option>
                  <option value="APPROVAL_PENDING" style={{ background: '#0d1526' }}>Approval Pending</option>
                  <option value="ACTUAL_NOT_LOGGED" style={{ background: '#0d1526' }}>Actual Not Logged</option>
                </select>
              </div>
              <div><label style={IS.label}>Threshold (days)</label><input {...register('thresholdDays')} type="number" min={1} max={365} style={IS.input} onFocus={focus} onBlur={blur} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div>
                <label style={IS.label}>Notify Role</label>
                <select {...register('notifyRole')} style={IS.select} onFocus={focus} onBlur={blur}>
                  {['EMPLOYEE','MANAGER','ADMIN'].map((r) => <option key={r} style={{ background: '#0d1526' }}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: C.sub, cursor: 'pointer' }}>
                  <input {...register('isActive')} type="checkbox" style={{ accentColor: C.purple }} />Active
                </label>
              </div>
            </div>
            <button type="submit" disabled={upsertMutation.isPending} className="btn-primary" style={{ fontSize: '0.8rem' }}>{upsertMutation.isPending ? 'Saving…' : 'Save Rule'}</button>
          </form>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, marginBottom: '1rem' }}>Active Rules ({rules.length})</p>
          {rules.length === 0 ? <p style={{ color: C.muted, fontSize: '0.8rem' }}>No rules configured.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(rules as EscalationRule[]).map((rule) => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.text, margin: 0 }}>{rule.name}</p>
                    <p style={{ fontSize: '0.7rem', color: C.muted, margin: '0.15rem 0 0' }}>{rule.triggerEvent} · {rule.thresholdDays}d · {rule.notifyRole}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '999px', background: rule.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: rule.isActive ? '#6ee7b7' : C.muted, border: `1px solid ${rule.isActive ? 'rgba(16,185,129,0.3)' : C.border}` }}>{rule.isActive ? 'Active' : 'Off'}</span>
                    <button onClick={() => deleteMutation.mutate(rule.id)} style={{ fontSize: '0.7rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text, marginBottom: '0.75rem' }}>Recent Escalations ({logs.length})</p>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {logs.map((log) => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.625rem 0.875rem', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#fcd34d' }}>{log.user.name}</span>
                  <span style={{ color: C.muted, margin: '0 0.4rem', fontSize: '0.75rem' }}>·</span>
                  <span style={{ fontSize: '0.775rem', color: C.sub }}>{log.message}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: C.muted, whiteSpace: 'nowrap', marginLeft: '0.75rem' }}>{new Date(log.sentAt).toLocaleDateString()}</span>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>Analytics</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select value={cycleYear} onChange={(e) => setCycleYear(Number(e.target.value))}
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: C.text, outline: 'none', cursor: 'pointer' }}>
            {[2024, 2025, 2026].map((y) => <option key={y} style={{ background: '#0d1526' }}>{y}</option>)}
          </select>
          <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            {(['charts', 'escalation'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 500, textTransform: 'capitalize', background: tab === t ? C.purple : 'transparent', color: tab === t ? 'white' : C.muted, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
                {t}
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
