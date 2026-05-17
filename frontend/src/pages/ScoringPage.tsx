import { useState } from 'react';
import PageHero from '../components/PageHero';

const card: React.CSSProperties = { 
  background: '#ffffff', 
  border: '1px solid #e2e8f0', 
  borderRadius: '14px', 
  padding: '1.5rem', 
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)' 
};

const sectionTitle = (text: string) => (
  <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
    {text}
  </h2>
);

type ScoringType = 'MAX' | 'MIN' | 'TIMELINE' | 'ZERO';

const SCORING_TYPES: { 
  type: ScoringType; 
  icon: string; 
  title: string; 
  description: string; 
  whenToUse: string;
  formula: string;
  example: { target: string; actual: string; score: string };
  color: string;
  bg: string;
}[] = [
  {
    type: 'MAX',
    icon: '📈',
    title: 'MAX - Higher is Better',
    description: 'Use when you want to achieve MORE than your target.',
    whenToUse: 'Sales revenue, projects completed, customers acquired, units produced',
    formula: 'Score = (Actual ÷ Target) × 100%',
    example: { target: 'Target: 100', actual: 'Actual: 120', score: 'Score: 120%' },
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    type: 'MIN',
    icon: '📉',
    title: 'MIN - Lower is Better',
    description: 'Use when you want to achieve LESS than your target.',
    whenToUse: 'Defects, complaints, costs, turnaround time, errors',
    formula: 'Score = 100% if actual ≤ target, decreases if higher',
    example: { target: 'Target: 10 defects', actual: 'Actual: 5 defects', score: 'Score: 100%' },
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    type: 'TIMELINE',
    icon: '📅',
    title: 'TIMELINE - On-Time Completion',
    description: 'Use when you have a deadline to meet.',
    whenToUse: 'Project deadlines, delivery dates, milestone completion',
    formula: 'Score = 100% if on time, reduces by 3.3% per day late',
    example: { target: 'Deadline: Dec 31', actual: 'Completed: Dec 28', score: 'Score: 100%' },
    color: '#4338ca',
    bg: '#eef2ff',
  },
  {
    type: 'ZERO',
    icon: '🎯',
    title: 'ZERO - Zero Tolerance',
    description: 'Use when only ZERO is acceptable.',
    whenToUse: 'Safety incidents, security breaches, compliance violations',
    formula: 'Score = 100% if actual is 0, otherwise 0%',
    example: { target: 'Target: 0 incidents', actual: 'Actual: 0 incidents', score: 'Score: 100%' },
    color: '#dc2626',
    bg: '#fef2f2',
  },
];

function Calculator() {
  const [type, setType] = useState<ScoringType>('MAX');
  const [target, setTarget] = useState('100');
  const [actual, setActual] = useState('120');
  const [deadline, setDeadline] = useState('2024-12-31');
  const [completed, setCompleted] = useState('2024-12-28');

  const calculateScore = (): number => {
    const t = parseFloat(target);
    const a = parseFloat(actual);

    switch (type) {
      case 'MAX':
        if (t === 0) return a === 0 ? 100 : 0;
        return Math.min((a / t) * 100, 100);
      
      case 'MIN':
        if (t === 0) return a === 0 ? 100 : 0;
        return a <= t ? 100 : Math.max(0, 100 - ((a - t) / t) * 100);
      
      case 'TIMELINE': {
        const deadlineMs = new Date(deadline).getTime();
        const completedMs = new Date(completed).getTime();
        if (completedMs <= deadlineMs) return 100;
        const daysLate = (completedMs - deadlineMs) / 86_400_000;
        return Math.max(0, 100 - (daysLate / 30) * 100);
      }
      
      case 'ZERO':
        return a === 0 ? 100 : 0;
      
      default:
        return 0;
    }
  };

  const score = calculateScore();
  const scoreColor = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';
  const scoreBg = score >= 80 ? '#ecfdf5' : score >= 50 ? '#fffbeb' : '#fef2f2';

  return (
    <div style={{ ...card, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {sectionTitle('🧮 Score Calculator')}
      <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
        Try different values to see how scores are calculated.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Scoring Type
          </label>
          <select value={type} onChange={(e) => setType(e.target.value as ScoringType)}
            style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem', color: '#0f172a', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="MAX">MAX - Higher is Better</option>
            <option value="MIN">MIN - Lower is Better</option>
            <option value="TIMELINE">TIMELINE - On-Time</option>
            <option value="ZERO">ZERO - Zero Tolerance</option>
          </select>
        </div>

        {type !== 'TIMELINE' && type !== 'ZERO' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target
            </label>
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)}
              style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        {type !== 'TIMELINE' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Actual
            </label>
            <input type="number" value={actual} onChange={(e) => setActual(e.target.value)}
              style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        {type === 'TIMELINE' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Deadline
              </label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Completed Date
              </label>
              <input type="date" value={completed} onChange={(e) => setCompleted(e.target.value)}
                style={{ width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem 0.875rem', fontSize: '0.8125rem', color: '#0f172a', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </>
        )}
      </div>

      <div style={{ background: scoreBg, border: `2px solid ${scoreColor}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
          Calculated Score
        </div>
        <div style={{ fontSize: '3rem', fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: '-0.03em' }}>
          {score.toFixed(1)}%
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
          {score >= 80 ? '🎉 Excellent Performance!' : score >= 50 ? '👍 Good Progress' : '⚠️ Needs Improvement'}
        </div>
      </div>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
      <PageHero variant="scoring" />

      {/* Hero */}
      <div style={{ ...card, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
            Understanding Performance
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.5rem', letterSpacing: '-0.025em' }}>
            How Scoring Works
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6, maxWidth: '520px' }}>
            AtomQuest automatically calculates your performance score based on your goals and achievements. Learn how each scoring type works.
          </p>
        </div>
        <div style={{ fontSize: '4rem', flexShrink: 0 }}>📊</div>
      </div>

      {/* What is a Score */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        {sectionTitle('What is a Score?')}
        <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.7, margin: '0 0 1rem' }}>
          Your <strong style={{ color: '#4f46e5' }}>score</strong> is a percentage that shows how well you performed against your target. 
          It's calculated automatically by the system based on what you planned (target) and what you achieved (actual).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { range: '80% - 100%', label: 'Excellent', color: '#059669', bg: '#ecfdf5', icon: '🌟' },
            { range: '50% - 79%', label: 'Good', color: '#d97706', bg: '#fffbeb', icon: '👍' },
            { range: '0% - 49%', label: 'Needs Work', color: '#dc2626', bg: '#fef2f2', icon: '⚠️' },
          ].map((item) => (
            <div key={item.range} style={{ background: item.bg, border: `1px solid ${item.color}30`, borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: item.color, marginBottom: '0.25rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Scoring Types */}
      <div style={{ marginBottom: '1.5rem' }}>
        {sectionTitle('4 Types of Scoring')}
        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
          Choose the right scoring type when creating your goals. Each type calculates scores differently.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {SCORING_TYPES.map((item) => (
            <div key={item.type} style={{ ...card, borderColor: `${item.color}30`, background: item.bg }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: item.color, margin: '0 0 0.25rem' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0 0 0.75rem', lineHeight: 1.6 }}>
                    {item.description}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        When to Use
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#64748b', lineHeight: 1.5 }}>
                        {item.whenToUse}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Formula
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#0f172a', fontWeight: 600, fontFamily: 'monospace', background: 'rgba(255,255,255,0.7)', padding: '0.25rem 0.5rem', borderRadius: '5px', border: '1px solid #e2e8f0' }}>
                        {item.formula}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Example
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.775rem', color: '#64748b' }}>{item.example.target}</span>
                  <span style={{ color: '#cbd5e1' }}>→</span>
                  <span style={{ fontSize: '0.775rem', color: '#64748b' }}>{item.example.actual}</span>
                  <span style={{ color: '#cbd5e1' }}>→</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: item.color, background: 'rgba(255,255,255,0.9)', padding: '0.25rem 0.625rem', borderRadius: '6px', border: `1px solid ${item.color}30` }}>
                    {item.example.score}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculator */}
      <Calculator />

      {/* How Weighted Scores Work */}
      <div style={{ ...card, marginTop: '1.5rem' }}>
        {sectionTitle('How Your Final Score is Calculated')}
        <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.7, margin: '0 0 1rem' }}>
          Your <strong style={{ color: '#4f46e5' }}>final score</strong> is a weighted average of all your goals. 
          Goals with higher percentages have more impact on your final score.
        </p>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Example Calculation
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {[
              { goal: 'Increase Sales', percentage: 40, score: 90 },
              { goal: 'Reduce Costs', percentage: 30, score: 80 },
              { goal: 'Complete Projects', percentage: 30, score: 100 },
            ].map((item) => (
              <div key={item.goal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.8125rem', color: '#0f172a', fontWeight: 500 }}>{item.goal}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>{item.percentage}%</span>
                  <span style={{ color: '#cbd5e1' }}>×</span>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Your Final Score</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              89%
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
            Calculation: (40% × 90%) + (30% × 80%) + (30% × 100%) = 89%
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ ...card, marginTop: '1.5rem', background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)', border: '1px solid #c7d2fe' }}>
        {sectionTitle('💡 Tips for Better Scores')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[
            'Set realistic targets - too easy or too hard targets both affect your score',
            'Choose the right scoring type for each goal',
            'Update your progress regularly every quarter',
            'Focus on high-percentage goals - they impact your final score more',
            'For TIMELINE goals, complete tasks before the deadline for 100% score',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.7)', border: '1px solid #c7d2fe', borderRadius: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {i + 1}
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
