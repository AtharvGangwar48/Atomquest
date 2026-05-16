import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMySheets, createSheet, transitionSheet, getQuarterlyProgress, logActual } from '../api';
import type { GoalSheet, Quarter, QuarterlyProgressRow } from '../types';
import { useCycle } from '../store/cycle';
import GoalWizard from '../components/GoalWizard';
import StatusBadge from '../components/StatusBadge';
import WeightageMeter from '../components/WeightageMeter';

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const C = {
  card:       'rgba(255,255,255,0.04)',
  cardHover:  'rgba(255,255,255,0.07)',
  border:     'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(99,102,241,0.35)',
  text:       '#e2e8f0',
  textSub:    '#94a3b8',
  textMuted:  '#64748b',
  purple:     '#6366f1',
  cyan:       '#06b6d4',
  green:      '#10b981',
  amber:      '#f59e0b',
  red:        '#ef4444',
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? C.green : pct >= 50 ? C.amber : C.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', boxShadow: `0 0 6px ${color}88`, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color, width: '2rem', textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

function ActualCell({ row, quarter, sheetId, editable }: { row: QuarterlyProgressRow; quarter: Quarter; sheetId: string; editable: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const entry = row.actuals[quarter];

  const mutation = useMutation({
    mutationFn: (value: number) => logActual(row.goalId, quarter, value),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress', sheetId] }); setEditing(false); },
  });

  if (!editable) {
    return (
      <div style={{ textAlign: 'center' }}>
        {entry ? (
          <>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text }}>{entry.value}</div>
            <div style={{ fontSize: '0.65rem', color: C.textMuted }}>{Math.round(entry.score * 100)}%</div>
          </>
        ) : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
      </div>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus type="number" step="any"
        defaultValue={entry?.value ?? ''}
        style={{ width: '5rem', background: 'rgba(99,102,241,0.1)', border: `1px solid ${C.borderAccent}`, borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: C.text, textAlign: 'center', outline: 'none' }}
        onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) mutation.mutate(v); else setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }}
      />
    );
  }

  return (
    <button onClick={() => setEditing(true)} style={{ width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
      {entry ? (
        <>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: C.text }}>{entry.value}</div>
          <div style={{ fontSize: '0.65rem', color: C.textMuted }}>{Math.round(entry.score * 100)}%</div>
        </>
      ) : <span style={{ fontSize: '1.1rem', color: 'rgba(99,102,241,0.4)' }}>+</span>}
    </button>
  );
}

export default function MyGoalsPage() {
  const qc = useQueryClient();
  const { cycle, isQuarterWritable, isPastQuarter } = useCycle();
  const [showWizard, setShowWizard] = useState(false);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);

  const { data: sheets = [], isLoading } = useQuery({ queryKey: ['mySheets'], queryFn: getMySheets });
  const currentSheet: GoalSheet | undefined = sheets.find((s) => s.id === activeSheetId) ?? sheets[0];

  const { data: progress } = useQuery({
    queryKey: ['progress', currentSheet?.id],
    queryFn: () => getQuarterlyProgress(currentSheet!.id),
    enabled: !!currentSheet && currentSheet.status === 'APPROVED',
  });

  const createMutation = useMutation({
    mutationFn: () => createSheet(new Date().getFullYear()),
    onSuccess: (sheet) => { qc.invalidateQueries({ queryKey: ['mySheets'] }); setActiveSheetId(sheet.id); },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => transitionSheet(id, 'SUBMITTED'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mySheets'] }),
  });

  const usedWeightage = currentSheet?.goals.reduce((s, g) => s + g.weightage, 0) ?? 0;
  const canSubmit = currentSheet && ['DRAFT', 'REWORK'].includes(currentSheet.status) && Math.abs(usedWeightage - 100) < 0.01;

  if (isLoading) return <div style={{ padding: '2rem', color: C.textMuted }}>Loading…</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>My Goals</h1>
          {currentSheet && <StatusBadge status={currentSheet.status} />}
          {cycle && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
              {cycle.activePeriod === 'GOAL_SETTING' ? 'Goal Setting Period' : `Active: ${cycle.activePeriod}`}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          {!currentSheet && (
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="btn-primary">
              Start {new Date().getFullYear()} Goals
            </button>
          )}
          {currentSheet && ['DRAFT', 'REWORK'].includes(currentSheet.status) && (
            <>
              <button onClick={() => setShowWizard(true)} className="btn-primary">+ Add Goal</button>
              <button onClick={() => submitMutation.mutate(currentSheet.id)} disabled={!canSubmit || submitMutation.isPending} className="btn-success" title={!canSubmit ? 'Weightage must total 100%' : ''}>
                Submit for Approval
              </button>
            </>
          )}
        </div>
      </div>

      {currentSheet && (
        <>
          {['DRAFT', 'REWORK'].includes(currentSheet.status) && <div style={{ marginBottom: '1.25rem' }}><WeightageMeter current={usedWeightage} /></div>}

          {/* Quarterly table */}
          {currentSheet.status === 'APPROVED' && progress ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted, width: '220px' }}>Goal</th>
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted }}>Target</th>
                      {QUARTERS.map((q) => {
                        const writable = isQuarterWritable(q);
                        const past = isPastQuarter(q);
                        return (
                          <th key={q} style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: writable ? '#a5b4fc' : past ? C.textMuted : 'rgba(255,255,255,0.2)', background: writable ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                            {q}{writable && <span style={{ marginLeft: '0.25rem', fontSize: '0.6rem' }}>✎</span>}
                          </th>
                        );
                      })}
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted, width: '120px' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.rows.map((row) => {
                      const scores = Object.values(row.actuals).map((a) => a?.score ?? 0);
                      const bestScore = scores.length ? Math.max(...scores) : 0;
                      return (
                        <tr key={row.goalId} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>{row.thrustArea}</div>
                            <div style={{ fontWeight: 600, color: C.text, fontSize: '0.8125rem', lineHeight: 1.3 }}>{row.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                              <StatusBadge status={row.status} />
                              <span style={{ fontSize: '0.65rem', color: C.textMuted }}>{row.weightage}%</span>
                              <span style={{ fontSize: '0.65rem', color: C.textMuted }}>{row.scoringType}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 600, color: C.text }}>{row.target}</td>
                          {QUARTERS.map((q) => (
                            <td key={q} style={{ padding: '0.875rem 1rem', background: isQuarterWritable(q) ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                              <ActualCell row={row} quarter={q} sheetId={currentSheet.id} editable={isQuarterWritable(q)} />
                            </td>
                          ))}
                          <td style={{ padding: '0.875rem 1rem' }}><ScoreBar score={bestScore} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : currentSheet.status !== 'APPROVED' ? (
            currentSheet.goals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: C.textMuted }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.3 }}>◎</div>
                <p style={{ fontSize: '0.9rem' }}>No goals yet. Click "+ Add Goal" to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {currentSheet.goals.map((goal) => (
                  <div key={goal.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', transition: 'border-color 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.borderAccent; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                  >
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{goal.thrustArea}</span>
                      <p style={{ fontWeight: 600, color: C.text, margin: '0.15rem 0 0', fontSize: '0.875rem' }}>{goal.title}</p>
                      {goal.description && <p style={{ fontSize: '0.775rem', color: C.textSub, margin: '0.15rem 0 0' }}>{goal.description}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: C.textMuted }}>{goal.uomType} · {goal.scoringType}</span>
                      <span style={{ fontSize: '0.75rem', color: C.textSub }}>Target: <strong style={{ color: C.text }}>{goal.target}</strong></span>
                      <span style={{ fontSize: '0.75rem', color: C.purple, fontWeight: 600 }}>{goal.weightage}%</span>
                      <StatusBadge status={goal.status} />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </>
      )}

      {showWizard && currentSheet && (
        <GoalWizard sheetId={currentSheet.id} existingGoals={currentSheet.goals} onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
}
