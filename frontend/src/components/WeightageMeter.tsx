interface Props {
  current: number;
  adding?: number;
}

export default function WeightageMeter({ current, adding = 0 }: Props) {
  const total = current + adding;
  const over = total > 100;
  const pct = Math.min(total, 100);
  const color = over ? '#ef4444' : total >= 80 ? '#f59e0b' : '#6366f1';

  return (
    <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Weightage Used</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: over ? '#f87171' : 'var(--text-primary)' }}>
          {total.toFixed(1)}% / 100%
        </span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.3s, background 0.3s', boxShadow: `0 0 8px ${color}66` }} />
      </div>
      {over && <p style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '0.35rem' }}>Total weightage cannot exceed 100%</p>}
    </div>
  );
}
