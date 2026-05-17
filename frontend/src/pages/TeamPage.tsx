import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeamSheets, transitionSheet, updateGoal, addComment, getComments, getQuarterlyProgress } from '../api';
import type { GoalSheet, Goal, Quarter, CheckinComment } from '../types';
import { useCycle } from '../store/cycle';
import StatusBadge from '../components/StatusBadge';
import PageHero from '../components/PageHero';

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

function InlineCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (!editing) {
    return (
      <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', color: '#0f172a', padding: '0.1rem 0.35rem', borderRadius: '5px', transition: 'background 0.13s', fontWeight: 600 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#eef2ff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        title="Click to edit"
      >{value}</span>
    );
  }
  return (
    <input autoFocus type="number" value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); const n = parseFloat(draft); if (!isNaN(n) && n !== value) onSave(n); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }}
      style={{ width: '5rem', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '0.2rem 0.4rem', fontSize: '0.8rem', color: '#0f172a', outline: 'none' }}
    />
  );
}

function CheckinPanel({ sheet }: { sheet: GoalSheet }) {
  const qc = useQueryClient();
  const { cycle } = useCycle();
  const [activeQ, setActiveQ] = useState<Quarter>(cycle?.writableQuarter ?? 'Q1');
  const [commentText, setCommentText] = useState('');

  const { data: progress } = useQuery({ queryKey: ['progress', sheet.id], queryFn: () => getQuarterlyProgress(sheet.id) });
  const { data: comments = [] } = useQuery({ queryKey: ['comments', sheet.id], queryFn: () => getComments(sheet.id) });

  const commentMutation = useMutation({
    mutationFn: () => addComment(sheet.id, activeQ, commentText),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', sheet.id] }); setCommentText(''); },
  });

  const quarterComments = comments.filter((c) => c.quarter === activeQ);

  return (
    <div style={{ borderTop: '1px solid #f1f5f9' }}>
      {/* Quarter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
        {QUARTERS.map((q) => {
          const count = comments.filter((c) => c.quarter === q).length;
          const active = activeQ === q;
          return (
            <button key={q} onClick={() => setActiveQ(q)}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.8125rem', fontWeight: active ? 600 : 400, color: active ? '#4f46e5' : '#64748b', background: 'none', border: 'none', borderBottom: `2px solid ${active ? '#4f46e5' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.13s', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit' }}
            >
              {q}
              {count > 0 && <span style={{ fontSize: '0.6rem', background: '#eef2ff', color: '#4338ca', padding: '0.1rem 0.35rem', borderRadius: '999px', fontWeight: 700 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Planned vs Actual */}
        <div>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>Planned vs Actual — {activeQ}</p>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Goal', 'Target', 'Actual', 'Score'].map((h) => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: h === 'Goal' ? 'left' : 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progress ? progress.rows.map((row) => {
                  const entry = row.actuals[activeQ];
                  const scorePct = entry ? Math.round(entry.score * 100) : null;
                  const scoreColor = scorePct !== null ? (scorePct >= 80 ? '#059669' : scorePct >= 50 ? '#d97706' : '#dc2626') : '#94a3b8';
                  return (
                    <tr key={row.goalId} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.6rem', color: '#4f46e5', fontWeight: 600, textTransform: 'uppercase' }}>{row.thrustArea}</div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.775rem' }}>{row.title}</div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#475569' }}>{row.target}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: entry ? '#0f172a' : '#e2e8f0' }}>{entry ? entry.value : '—'}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        {scorePct !== null ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scoreColor, background: scorePct >= 80 ? '#ecfdf5' : scorePct >= 50 ? '#fffbeb' : '#fef2f2', padding: '0.15rem 0.4rem', borderRadius: '5px' }}>{scorePct}%</span>
                        ) : <span style={{ color: '#e2e8f0' }}>—</span>}
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>No data yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Check-in Comments — {activeQ}</p>
          <div style={{ flex: 1, maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {quarterComments.length === 0 ? (
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', fontStyle: 'italic' }}>No comments yet for {activeQ}.</p>
            ) : quarterComments.map((c: CheckinComment) => (
              <div key={c.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.625rem 0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5' }}>{c.manager.name}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>{c.comment}</p>
              </div>
            ))}
          </div>
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3}
            placeholder={`Add ${activeQ} check-in comment…`}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#0f172a', resize: 'none', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
          <button onClick={() => commentMutation.mutate()} disabled={!commentText.trim() || commentMutation.isPending} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
            {commentMutation.isPending ? 'Saving…' : 'Add Comment'}
          </button>
          <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0 }}>Comments are permanent once submitted.</p>
        </div>
      </div>
    </div>
  );
}

interface SheetRowProps {
  sheet: GoalSheet; expanded: boolean; checkinOpen: boolean;
  onToggle: () => void; onCheckin: () => void;
  onTransition: (s: string) => void; onUpdateGoal: (id: string, d: Partial<Goal>) => void;
}

function SheetRow({ sheet, expanded, checkinOpen, onToggle, onCheckin, onTransition, onUpdateGoal }: SheetRowProps) {
  const totalWeightage = sheet.goals.reduce((s, g) => s + g.weightage, 0);
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.13s, box-shadow 0.13s', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#c7d2fe'; el.style.boxShadow = '0 4px 12px rgba(79,70,229,0.07)'; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e2e8f0'; el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {sheet.employee?.name?.[0] ?? '?'}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '0.875rem' }}>{sheet.employee?.name}</p>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>{sheet.employee?.email} · {sheet.cycleYear}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{sheet.goals.length} goals · {totalWeightage}%</span>
          <StatusBadge status={sheet.status} />
          {sheet.status === 'SUBMITTED' && (
            <div style={{ display: 'flex', gap: '0.375rem' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onTransition('APPROVED')} className="btn-success" style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem' }}>Approve</button>
              <button onClick={() => onTransition('REWORK')}
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.13s' }}>
                Rework
              </button>
            </div>
          )}
          {sheet.status === 'APPROVED' && (
            <button onClick={(e) => { e.stopPropagation(); onCheckin(); }}
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.75rem', borderRadius: '6px', border: `1px solid ${checkinOpen ? '#c7d2fe' : '#e2e8f0'}`, background: checkinOpen ? '#eef2ff' : 'transparent', color: checkinOpen ? '#4338ca' : '#94a3b8', cursor: 'pointer', transition: 'all 0.13s', fontFamily: 'inherit', fontWeight: 500 }}
            >Check-in</button>
          )}
          <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && sheet.status !== 'APPROVED' && sheet.goals.length > 0 && (
        <div style={{ borderTop: '1px solid #f1f5f9', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Thrust Area', 'Title', 'UOM', 'Scoring', 'Target', 'Weightage', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.goals.map((goal) => (
                <tr key={goal.id} style={{ borderBottom: '1px solid #f8fafc' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafbff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td style={{ padding: '0.625rem 1rem', color: '#4f46e5', fontSize: '0.775rem', fontWeight: 500 }}>{goal.thrustArea}</td>
                  <td style={{ padding: '0.625rem 1rem', fontWeight: 600, color: '#0f172a' }}>{goal.title}</td>
                  <td style={{ padding: '0.625rem 1rem', color: '#64748b' }}>{goal.uomType}</td>
                  <td style={{ padding: '0.625rem 1rem', color: '#64748b' }}>{goal.scoringType}</td>
                  <td style={{ padding: '0.625rem 1rem', color: '#0f172a', fontWeight: 500 }}>
                    {sheet.status === 'SUBMITTED' ? <InlineCell value={goal.target} onSave={(v) => onUpdateGoal(goal.id, { target: v })} /> : goal.target}
                  </td>
                  <td style={{ padding: '0.625rem 1rem' }}>
                    {sheet.status === 'SUBMITTED' ? <InlineCell value={goal.weightage} onSave={(v) => onUpdateGoal(goal.id, { weightage: v })} /> : (
                      <span style={{ color: '#4f46e5', fontWeight: 600, background: '#eef2ff', padding: '0.15rem 0.5rem', borderRadius: '5px', fontSize: '0.75rem' }}>{goal.weightage}%</span>
                    )}
                  </td>
                  <td style={{ padding: '0.625rem 1rem' }}><StatusBadge status={goal.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {checkinOpen && sheet.status === 'APPROVED' && <CheckinPanel sheet={sheet} />}
    </div>
  );
}

export default function TeamPage() {
  const qc = useQueryClient();
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [checkinSheet, setCheckinSheet] = useState<string | null>(null);

  const { data: sheets = [], isLoading } = useQuery({ queryKey: ['teamSheets'], queryFn: getTeamSheets });

  const transitionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => transitionSheet(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['teamSheets'] });
      const prev = qc.getQueryData<GoalSheet[]>(['teamSheets']);
      qc.setQueryData<GoalSheet[]>(['teamSheets'], (old) => old?.map((s) => s.id === id ? { ...s, status: status as GoalSheet['status'] } : s));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['teamSheets'], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['teamSheets'] }),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: Partial<Goal> }) => updateGoal(goalId, data),
    onMutate: async ({ goalId, data }) => {
      await qc.cancelQueries({ queryKey: ['teamSheets'] });
      const prev = qc.getQueryData<GoalSheet[]>(['teamSheets']);
      qc.setQueryData<GoalSheet[]>(['teamSheets'], (old) => old?.map((s) => ({ ...s, goals: s.goals.map((g) => g.id === goalId ? { ...g, ...data } : g) })));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['teamSheets'], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['teamSheets'] }),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: '#94a3b8' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 0.7s linear infinite' }} />
      Loading…
    </div>
  );

  const pending  = sheets.filter((s) => s.status === 'SUBMITTED');
  const approved = sheets.filter((s) => s.status === 'APPROVED');
  const others   = sheets.filter((s) => !['SUBMITTED', 'APPROVED'].includes(s.status));

  const renderGroup = (label: string, accent: string, bgAccent: string, group: GoalSheet[]) =>
    group.length > 0 && (
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent }} />
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#64748b', margin: 0 }}>{label}</p>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: bgAccent, color: accent, border: `1px solid ${accent}30` }}>{group.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {group.map((sheet) => (
            <SheetRow key={sheet.id} sheet={sheet}
              expanded={expandedSheet === sheet.id} checkinOpen={checkinSheet === sheet.id}
              onToggle={() => setExpandedSheet(expandedSheet === sheet.id ? null : sheet.id)}
              onCheckin={() => setCheckinSheet(checkinSheet === sheet.id ? null : sheet.id)}
              onTransition={(status) => transitionMutation.mutate({ id: sheet.id, status })}
              onUpdateGoal={(goalId, data) => updateGoalMutation.mutate({ goalId, data })}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
      <PageHero variant="team" />
      <h1 className="page-header" style={{ marginBottom: '1.75rem' }}>Team Goal Sheets</h1>
      {renderGroup('Pending Approval', '#d97706', '#fffbeb', pending)}
      {renderGroup('Active', '#059669', '#ecfdf5', approved)}
      {renderGroup('Other', '#64748b', '#f1f5f9', others)}
      {sheets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>⬡</div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No team sheets found.</p>
        </div>
      )}
    </div>
  );
}
