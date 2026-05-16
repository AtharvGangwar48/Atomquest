import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditTrail } from '../api';
import type { AuditLog } from '../types';

const C = { card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#e2e8f0', sub: '#94a3b8', muted: '#64748b', purple: '#6366f1', green: '#10b981', red: '#ef4444', blue: '#3b82f6' };

const IS = {
  input:  { background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.5rem 0.875rem', fontSize: '0.8125rem', color: C.text, outline: 'none', fontFamily: 'inherit' },
  select: { background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.5rem 0.875rem', fontSize: '0.8125rem', color: C.text, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' },
};

const ACTION_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  CREATE: { bg: 'rgba(16,185,129,0.12)',  color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  UPDATE: { bg: 'rgba(99,102,241,0.12)',  color: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  DELETE: { bg: 'rgba(239,68,68,0.12)',   color: '#fca5a5', border: 'rgba(239,68,68,0.3)'  },
};

function DiffViewer({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = useState(false);
  if (!value) return <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>—</span>;
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} style={{ fontSize: '0.75rem', color: '#a5b4fc', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
        {open ? 'Hide' : 'View'} {label}
      </button>
      {open && (
        <pre style={{ marginTop: '0.375rem', fontSize: '0.65rem', background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '0.5rem', overflowX: 'auto', maxWidth: '200px', maxHeight: '120px', overflowY: 'auto', color: '#94a3b8' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', entityType, entityId, page],
    queryFn: () => getAuditTrail({ entityType: entityType || undefined, entityId: entityId || undefined, page, limit: 50 }),
  });

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { (e.target as HTMLElement).style.borderColor = C.purple; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { (e.target as HTMLElement).style.borderColor = C.border; (e.target as HTMLElement).style.boxShadow = 'none'; };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Audit Trail</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} style={IS.select} onFocus={focus} onBlur={blur}>
          <option value="" style={{ background: '#0d1526' }}>All Entity Types</option>
          {['Goal', 'GoalSheet', 'GoalActual'].map((t) => <option key={t} style={{ background: '#0d1526' }}>{t}</option>)}
        </select>
        <input type="text" placeholder="Filter by Entity ID…" value={entityId} onChange={(e) => { setEntityId(e.target.value); setPage(1); }}
          style={{ ...IS.input, width: '280px' }} onFocus={focus} onBlur={blur} />
        {(entityType || entityId) && (
          <button onClick={() => { setEntityType(''); setEntityId(''); setPage(1); }}
            style={{ fontSize: '0.8rem', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear filters
          </button>
        )}
        {data && <span style={{ fontSize: '0.8rem', color: C.muted }}>{data.total} records</span>}
      </div>

      {isLoading ? (
        <div style={{ color: C.muted, fontSize: '0.875rem' }}>Loading…</div>
      ) : (
        <>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.2)' }}>
                    {['Timestamp', 'Action', 'Entity', 'Entity ID', 'Changed By', 'Old Value', 'New Value'].map((h) => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: C.muted, fontSize: '0.875rem' }}>No audit records found.</td></tr>
                  )}
                  {data?.logs.map((log: AuditLog) => {
                    const as_ = ACTION_STYLE[log.action] ?? ACTION_STYLE.UPDATE;
                    return (
                      <tr key={log.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: C.muted, whiteSpace: 'nowrap' }}>{new Date(log.changedAt).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: as_.bg, color: as_.color, border: `1px solid ${as_.border}` }}>{log.action}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: C.text }}>{log.entityType}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: C.muted, background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{log.entityId.slice(0, 8)}…</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: C.text, fontSize: '0.775rem' }}>{log.changer.name}</div>
                          <div style={{ fontSize: '0.65rem', color: C.muted }}>{log.changer.role}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}><DiffViewer label="old" value={log.oldValue} /></td>
                        <td style={{ padding: '0.75rem 1rem' }}><DiffViewer label="new" value={log.newValue} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {data && data.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>← Previous</button>
              <span style={{ fontSize: '0.8rem', color: C.muted }}>Page {page} of {data.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
