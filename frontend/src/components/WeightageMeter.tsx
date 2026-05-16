interface Props {
  current: number;
  adding?: number;
}

export default function WeightageMeter({ current, adding = 0 }: Props) {
  const total = current + adding;
  const over = total > 100;
  const pct = Math.min(total, 100);
  const color = over ? '#dc2626' : total >= 80 ? '#d97706' : '#4f46e5';
  const bgColor = over ? '#fef2f2' : total >= 80 ? '#fffbeb' : '#eef2ff';

  return (
    <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', background: bgColor, border: `1px solid ${over ? '#fecaca' : total >= 80 ? '#fde68a' : '#c7d2fe'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Weightage Used</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: over ? '#dc2626' : '#0f172a' }}>
          {total.toFixed(1)}% / 100%
        </span>
      </div>
      <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.3s, background 0.3s' }} />
      </div>
      {over && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.35rem', margin: '0.35rem 0 0' }}>Total weightage cannot exceed 100%</p>}
    </div>
  );
}
