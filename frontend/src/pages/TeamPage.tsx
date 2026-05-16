import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeamSheets, transitionSheet, updateGoal, addComment, getComments, getQuarterlyProgress } from '../api';
import type { GoalSheet, Goal, Quarter, CheckinComment } from '../types';
import { useCycle } from '../store/cycle';
import StatusBadge from '../components/StatusBadge';

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const C = {
  card:        'rgba(255,255,255,0.04)',
  cardHover:   'rgba(255,255,255,0.06)',
  border:      'rgba(255,255,255,0.08)',
  borderAccent:'rgba(99,102,241,0.35)',
  text:        '#e2e8f0',
  textSub:     '#94a3b8',
  textMuted:   '#64748b',
  purple:      '#6366f1',
  cyan:        '#06b6d4',
  green:       '#10b981',
  amber:       '#f59e0b',
  red:         '#ef4444',
  input:       'rgba(255,255,255,0.05)',
};

function InlineCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (!editing) {
    return (
      <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', color: C.text, padding: '0.1rem 0.3rem', borderRadius: '4px', transition: 'background 0.15s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)'; }}
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
      style={{ width: '5rem', background: 'rgba(99,102,241,0.1)', border: `1px solid ${C.borderAccent}`, borderRadius: '6px', padding: '0.2rem 0.4rem', fontSize: '0.8rem', color: C.text, outline: 'none' }}
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
    <div style={{ borderTop: `1px solid ${C.border}` }}>
      {/* Quarter tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.2)' }}>
        {QUARTERS.map((q) => {
          const count = comments.filter((c) => c.quarter === q).length;
          const active = activeQ === q;
          return (
            <button key={q} onClick={() => setActiveQ(q)}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.8125rem', fontWeight: active ? 600 : 400, color: active ? '#a5b4fc' : C.textMuted, background: 'none', border: 'none', borderBottom: `2px solid ${active ? C.purple : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {q}
              {count > 0 && <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Planned vs Actual */}
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.625rem' }}>Planned vs Actual — {activeQ}</p>
          <div style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Goal', 'Target', 'Actual', 'Score'].map((h) => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: h === 'Goal' ? 'left' : 'center', fontSize: '0.65rem', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progress ? progress.rows.map((row) => {
                  const entry = row.actuals[activeQ];
                  const scorePct = entry ? Math.round(entry.score * 100) : null;
                  return (
                    <tr key={row.goalId} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: C.cyan }}>{row.thrustArea}</div>
                        <div style={{ fontWeight: 600, color: C.text, fontSize: '0.775rem' }}>{row.title}</div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: C.textSub }}>{row.target}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, color: entry ? C.text : 'rgba(255,255,255,0.15)' }}>{entry ? entry.value : '—'}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        {scorePct !== null ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scorePct >= 80 ? C.green : scorePct >= 50 ? C.amber : C.red }}>{scorePct}%</span>
                        ) : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>—</span>}
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: C.textMuted, fontSize: '0.8rem' }}>No data yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Check-in Comments — {activeQ}</p>
          <div style={{ flex: 1, maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {quarterComments.length === 0 ? (
              <p style={{ fontSize: '0.775rem', color: C.textMuted, fontStyle: 'italic' }}>No comments yet for {activeQ}.</p>
            ) : quarterComments.map((c: CheckinComment) => (
              <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.625rem 0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc' }}>{c.manager.name}</span>
                  <span style={{ fontSize: '0.65rem', color: C.textMuted }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: C.textSub, margin: 0 }}>{c.comment}</p>
              </div>
            ))}
          </div>
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3}
            placeholder={`Add ${activeQ} check-in comment…`}
            style={{ background: C.input, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: C.text, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = C.borderAccent; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderColor = C.border; }}
          />
          <button onClick={() => commentMutation.mutate()} disabled={!commentText.trim() || commentMutation.isPending} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
            {commentMutation.isPending ? 'Saving…' : 'Add Comment'}
          </button>
          <p style={{ fontSize: '0.65rem', color: C.textMuted }}>Comments are permanent once submitted.</p>
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
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.borderAccent; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {sheet.employee?.name?.[0] ?? '?'}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: C.text, margin: 0, fontSize: '0.875rem' }}>{sheet.employee?.name}</p>
            <p style={{ fontSize: '0.7rem', color: C.textMuted, margin: 0 }}>{sheet.employee?.email} · {sheet.cycleYear}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: C.textMuted }}>{sheet.goals.length} goals · {totalWeightage}%</span>
          <StatusBadge status={sheet.status} />
          {sheet.status === 'SUBMITTED' && (
            <div style={{ display: 'flex', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onTransition('APPROVED')} className="btn-success" style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem' }}>Approve</button>
              <button onClick={() => onTransition('REWORK')} style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Rework</button>
            </div>
          )}
          {sheet.status === 'APPROVED' && (
            <button onClick={(e) => { e.stopPropagation(); onCheckin(); }}
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem', borderRadius: '6px', border: `1px solid ${checkinOpen ? C.purple : C.border}`, background: checkinOpen ? 'rgba(99,102,241,0.15)' : 'transparent', color: checkinOpen ? '#a5b4fc' : C.textMuted, cursor: 'pointer', transition: 'all 0.15s' }}
            >Check-in</button>
          )}
          <span style={{ color: C.textMuted, fontSize: '0.7rem' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && sheet.status !== 'APPROVED' && sheet.goals.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.15)' }}>
                {['Thrust Area', 'Title', 'UOM', 'Scoring', 'Target', 'Weightage', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.goals.map((goal) => (
                <tr key={goal.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                  <td style={{ padding: '0.625rem 1rem', color: C.cyan, fontSize: '0.775rem' }}>{goal.thrustArea}</td>
                  <td style={{ padding: '0.625rem 1rem', fontWeight: 600, color: C.text }}>{goal.title}</td>
                  <td style={{ padding: '0.625rem 1rem', color: C.textSub }}>{goal.uomType}</td>
                  <td style={{ padding: '0.625rem 1rem', color: C.textSub }}>{goal.scoringType}</td>
                  <td style={{ padding: '0.625rem 1rem', color: C.text }}>
                    {sheet.status === 'SUBMITTED' ? <InlineCell value={goal.target} onSave={(v) => onUpdateGoal(goal.id, { target: v })} /> : goal.target}
                  </td>
                  <td style={{ padding: '0.625rem 1rem', color: C.text }}>
                    {sheet.status === 'SUBMITTED' ? <InlineCell value={goal.weightage} onSave={(v) => onUpdateGoal(goal.id, { weightage: v })} /> : `${goal.weightage}%`}
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

  if (isLoading) return <div style={{ padding: '2rem', color: C.textMuted }}>Loading…</div>;

  const pending  = sheets.filter((s) => s.status === 'SUBMITTED');
  const approved = sheets.filter((s) => s.status === 'APPROVED');
  const others   = sheets.filter((s) => !['SUBMITTED', 'APPROVED'].includes(s.status));

  const renderGroup = (label: string, accent: string, group: GoalSheet[]) =>
    group.length > 0 && (
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: '0.625rem' }}>{label} ({group.length})</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Team Goal Sheets</h1>
      {renderGroup('Pending Approval', '#fbbf24', pending)}
      {renderGroup('Active', '#34d399', approved)}
      {renderGroup('Other', '#64748b', others)}
      {sheets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: C.textMuted }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }}>⬡</div>
          <p style={{ fontSize: '0.9rem' }}>No team sheets found.</p>
        </div>
      )}
    </div>
  );
}
