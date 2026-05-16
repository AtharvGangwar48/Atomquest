import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logActual } from '../api';
import type { Goal } from '../types';

const num = () => z.coerce.number();
const schema = z.object({
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  actualValue: num().refine((v) => v >= 0, 'Must be ≥ 0'),
});
type FormData = z.infer<typeof schema>;

const IS = {
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.6rem 0.875rem', fontSize: '0.875rem', color: '#e2e8f0', outline: 'none', fontFamily: 'inherit' },
  label: { display: 'block' as const, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
};

export default function LogActualModal({ goal, sheetId, onClose }: { goal: Goal; sheetId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quarter: 'Q1' },
  });

  const mutation = useMutation({
    mutationFn: (d: FormData) => logActual(goal.id, d.quarter, d.actualValue),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sheet', sheetId] }); onClose(); },
  });

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { (e.target as HTMLElement).style.borderColor = '#6366f1'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; };
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLElement).style.boxShadow = 'none'; };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: 'rgba(13,18,35,0.97)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '18px', width: '100%', maxWidth: '380px', padding: '1.75rem', boxShadow: '0 0 50px rgba(99,102,241,0.15)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: '0 0 0.25rem' }}>Log Actual</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.25rem' }}>{goal.title}</p>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={IS.label}>Quarter</label>
            <select {...register('quarter')} style={{ ...IS.input, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => <option key={q} style={{ background: '#0d1526' }}>{q}</option>)}
            </select>
          </div>
          <div>
            <label style={IS.label}>Actual Value <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(target: {goal.target})</span></label>
            <input {...register('actualValue')} type="number" step="any" style={IS.input} onFocus={focus} onBlur={blur} />
            {errors.actualValue && <p style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.actualValue.message}</p>}
          </div>
          {mutation.isError && <p style={{ color: '#f87171', fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.25)' }}>Failed to log actual.</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.75rem' }}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving…' : 'Log Actual'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
