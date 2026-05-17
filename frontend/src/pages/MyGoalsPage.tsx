import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMySheets, createSheet, transitionSheet, getQuarterlyProgress, logActual } from '../api';
import type { GoalSheet, Quarter, QuarterlyProgressRow } from '../types';
import { useCycle } from '../store/cycle';
import { useAuth } from '../store/auth';
import GoalWizard from '../components/GoalWizard';
import StatusBadge from '../components/StatusBadge';
import WeightageMeter from '../components/WeightageMeter';
import PageHero from '../components/PageHero';

// ── Welcome Banner ─────────────────────────────────────────────────────────
function WelcomeBanner({ userId }: { userId: string }) {
  const key = `aq_welcome_dismissed_${userId}`;
  const [visible, setVisible] = useState(() => !localStorage.getItem(key));

  if (!visible) return null;

  const dismiss = () => { localStorage.setItem(key, '1'); setVisible(false); };

  return (
    <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)', border: '1px solid #c7d2fe', display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative' }}>
      <div style={{ fontSize: '1.75rem', flexShrink: 0, lineHeight: 1 }}>👋</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#3730a3', margin: '0 0 0.25rem' }}>Welcome to AtomQuest!</p>
        <p style={{ fontSize: '0.8125rem', color: '#4338ca', margin: '0 0 0.625rem', lineHeight: 1.6 }}>
          Set your yearly goals, get manager approval, and track your progress every quarter. It's simple!
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            '1 · Click "Start Goals" button',
            '2 · Add your goals (total must be 100%)',
            '3 · Submit to your manager',
            '4 · Update progress each quarter',
          ].map((tip) => (
            <span key={tip} style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4338ca', background: 'rgba(255,255,255,0.7)', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '0.25rem 0.5rem' }}>{tip}</span>
          ))}
        </div>
        <Link to="/help" style={{ display: 'inline-block', marginTop: '0.625rem', fontSize: '0.775rem', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
          Need help? Click here for step-by-step guide →
        </Link>
      </div>
      <button onClick={dismiss} title="Dismiss" style={{ position: 'absolute', top: '0.75rem', right: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#a5b4fc', lineHeight: 1, padding: '0.125rem', fontFamily: 'inherit' }}>✕</button>
    </div>
  );
}

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626';
  const bg = pct >= 80 ? '#ecfdf5' : pct >= 50 ? '#fffbeb' : '#fef2f2';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color, width: '2.5rem', textAlign: 'right', background: bg, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{pct}%</span>
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
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{entry.value}</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{Math.round(entry.score * 100)}%</div>
          </>
        ) : <span style={{ color: '#e2e8f0', fontSize: '1rem' }}>—</span>}
      </div>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus type="number" step="any"
        defaultValue={entry?.value ?? ''}
        style={{ width: '5rem', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#0f172a', textAlign: 'center', outline: 'none' }}
        onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) mutation.mutate(v); else setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(false); }}
      />
    );
  }

  return (
    <button onClick={() => setEditing(true)} style={{ width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '6px', transition: 'background 0.13s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#eef2ff'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      {entry ? (
        <>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{entry.value}</div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{Math.round(entry.score * 100)}%</div>
        </>
      ) : <span style={{ fontSize: '1.2rem', color: '#c7d2fe', fontWeight: 300 }}>+</span>}
    </button>
  );
}

export default function MyGoalsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
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

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading…</span>
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
      <PageHero variant="mygoals" />
      {user && <WelcomeBanner userId={user.id} />}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 className="page-header">My Goals</h1>
          {currentSheet && <StatusBadge status={currentSheet.status} />}
          {cycle && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '999px', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
              {cycle.activePeriod === 'GOAL_SETTING' ? 'Goal Setting Period' : `Active: ${cycle.activePeriod}`}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!currentSheet && (
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="btn-primary">
              Start {new Date().getFullYear()} Goals
            </button>
          )}
          {currentSheet && ['DRAFT', 'REWORK'].includes(currentSheet.status) && (
            <>
              <button onClick={() => setShowWizard(true)} className="btn-ghost">+ Add Goal</button>
              <button onClick={() => submitMutation.mutate(currentSheet.id)} disabled={!canSubmit || submitMutation.isPending} className="btn-primary" title={!canSubmit ? 'Weightage must total 100%' : ''}>
                Submit for Approval
              </button>
            </>
          )}
        </div>
      </div>

      {currentSheet && (
        <>
          {['DRAFT', 'REWORK'].includes(currentSheet.status) && (
            <div style={{ marginBottom: '1.25rem' }}><WeightageMeter current={usedWeightage} /></div>
          )}

          {currentSheet.status === 'APPROVED' && progress ? (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', width: '220px' }}>Goal</th>
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>Target</th>
                      {QUARTERS.map((q) => {
                        const writable = isQuarterWritable(q);
                        const past = isPastQuarter(q);
                        return (
                          <th key={q} style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: writable ? '#4338ca' : past ? '#94a3b8' : '#cbd5e1', background: writable ? '#eef2ff' : 'transparent' }}>
                            {q}{writable && <span style={{ marginLeft: '0.25rem', fontSize: '0.55rem' }}>✎</span>}
                          </th>
                        );
                      })}
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', width: '130px' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.rows.map((row) => {
                      const scores = Object.values(row.actuals).map((a) => a?.score ?? 0);
                      const bestScore = scores.length ? Math.max(...scores) : 0;
                      return (
                        <tr key={row.goalId} style={{ borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafbff'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>{row.thrustArea}</div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8125rem', lineHeight: 1.35 }}>{row.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                              <StatusBadge status={row.status} />
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{row.weightage}% · {row.scoringType}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{row.target}</td>
                          {QUARTERS.map((q) => (
                            <td key={q} style={{ padding: '0.875rem 1rem', background: isQuarterWritable(q) ? 'rgba(79,70,229,0.025)' : 'transparent' }}>
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
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>◎</div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No goals yet. Click "+ Add Goal" to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentSheet.goals.map((goal) => (
                  <div key={goal.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', transition: 'border-color 0.13s, box-shadow 0.13s', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#c7d2fe'; el.style.boxShadow = '0 4px 12px rgba(79,70,229,0.08)'; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e2e8f0'; el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{goal.thrustArea}</span>
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: '0.15rem 0 0', fontSize: '0.875rem' }}>{goal.title}</p>
                      {goal.description && <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0.1rem 0 0' }}>{goal.description}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{goal.uomType} · {goal.scoringType}</span>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>Target: <strong style={{ color: '#0f172a' }}>{goal.target}</strong></span>
                      <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 700, background: '#eef2ff', padding: '0.15rem 0.5rem', borderRadius: '5px' }}>{goal.weightage}%</span>
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
