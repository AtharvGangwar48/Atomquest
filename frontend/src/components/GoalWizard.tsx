import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGoal } from '../api';
import WeightageMeter from './WeightageMeter';
import type { Goal } from '../types';

const num = (opts?: Parameters<typeof z.number>[0]) => z.coerce.number(opts);

const schema = z.object({
  thrustArea:  z.string().min(1, 'Required'),
  title:       z.string().min(1, 'Required'),
  description: z.string().optional(),
  uomType:     z.enum(['PERCENTAGE', 'NUMBER', 'CURRENCY', 'BOOLEAN']),
  scoringType: z.enum(['MAX', 'MIN', 'TIMELINE', 'ZERO']),
  target:      num().refine((v) => v > 0, 'Must be positive'),
  deadline:    z.string().optional(),
  weightage:   num().refine((v) => v >= 0.1 && v <= 100, 'Must be 0.1–100'),
  isShared:    z.boolean(),
});
type FormData = z.infer<typeof schema>;

const STEPS = ['Thrust Area', 'Goal Details', 'Targets', 'Review'];

const S = {
  overlay:  { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
  modal:    { background: 'rgba(13,18,35,0.95)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 0 60px rgba(99,102,241,0.15)' },
  label:    { display: 'block' as const, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  input:    { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.6rem 0.875rem', fontSize: '0.875rem', color: '#e2e8f0', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' },
  select:   { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.6rem 0.875rem', fontSize: '0.875rem', color: '#e2e8f0', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  error:    { color: '#f87171', fontSize: '0.7rem', marginTop: '0.25rem' },
  row:      { display: 'flex' as const, justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
};

export default function GoalWizard({ sheetId, existingGoals, onClose }: { sheetId: string; existingGoals: Goal[]; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const qc = useQueryClient();
  const usedWeightage = existingGoals.reduce((s, g) => s + g.weightage, 0);

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { uomType: 'NUMBER', scoringType: 'MAX', isShared: false },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = { ...data, ...(data.deadline ? { deadline: new Date(data.deadline).toISOString() } : {}) };
      return createGoal(sheetId, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mySheets'] }); onClose(); },
  });

  const watchedWeightage = watch('weightage') || 0;
  const watchedScoringType = watch('scoringType');
  const values = watch();

  const stepFields: (keyof FormData)[][] = [['thrustArea'], ['title', 'description'], ['uomType', 'scoringType', 'target', 'weightage'], []];
  const next = async () => { const ok = await trigger(stepFields[step] as (keyof FormData)[]); if (ok) setStep((s) => s + 1); };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    (e.target as HTMLElement).style.borderColor = '#6366f1';
    (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
    (e.target as HTMLElement).style.boxShadow = 'none';
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, background: i < step ? '#6366f1' : i === step ? 'linear-gradient(135deg,#6366f1,#06b6d4)' : 'rgba(255,255,255,0.06)', color: i <= step ? 'white' : '#64748b', border: i === step ? 'none' : `1px solid ${i < step ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, boxShadow: i === step ? '0 0 12px rgba(99,102,241,0.5)' : 'none' }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: i === step ? 600 : 400, color: i === step ? '#a5b4fc' : '#475569', display: 'none', whiteSpace: 'nowrap' }} className="sm-show">{s}</span>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: '1px', background: i < step ? '#6366f1' : 'rgba(255,255,255,0.07)' }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          {/* Step 0 */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Select Thrust Area</h2>
              <div>
                <label style={S.label}>Thrust Area *</label>
                <select {...register('thrustArea')} style={S.select} onFocus={focusStyle} onBlur={blurStyle}>
                  <option value="" style={{ background: '#0d1526' }}>Select…</option>
                  {['Revenue Growth', 'Customer Success', 'Operational Excellence', 'People & Culture', 'Innovation', 'Compliance'].map((a) => (
                    <option key={a} value={a} style={{ background: '#0d1526' }}>{a}</option>
                  ))}
                </select>
                {errors.thrustArea && <p style={S.error}>{errors.thrustArea.message}</p>}
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Goal Details</h2>
              <div>
                <label style={S.label}>Title *</label>
                <input {...register('title')} style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                {errors.title && <p style={S.error}>{errors.title.message}</p>}
              </div>
              <div>
                <label style={S.label}>Description</label>
                <textarea {...register('description')} rows={3} style={{ ...S.input, resize: 'none' }} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#94a3b8' }}>
                <input {...register('isShared')} type="checkbox" style={{ accentColor: '#6366f1' }} />
                This is a shared goal
              </label>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Set Targets</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={S.label}>Unit of Measure *</label>
                  <select {...register('uomType')} style={S.select} onFocus={focusStyle} onBlur={blurStyle}>
                    {[['NUMBER','Number'],['PERCENTAGE','Percentage'],['CURRENCY','Currency'],['BOOLEAN','Yes/No']].map(([v,l]) => <option key={v} value={v} style={{ background: '#0d1526' }}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Scoring Type *</label>
                  <select {...register('scoringType')} style={S.select} onFocus={focusStyle} onBlur={blurStyle}>
                    {[['MAX','MAX — higher is better'],['MIN','MIN — lower is better'],['TIMELINE','TIMELINE — by deadline'],['ZERO','ZERO — stay at zero']].map(([v,l]) => <option key={v} value={v} style={{ background: '#0d1526' }}>{l}</option>)}
                  </select>
                </div>
              </div>
              {watchedScoringType === 'TIMELINE' && (
                <div>
                  <label style={S.label}>Deadline</label>
                  <input {...register('deadline')} type="date" style={{ ...S.input, colorScheme: 'dark' }} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={S.label}>Target Value *</label>
                  <input {...register('target')} type="number" step="any" style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                  {errors.target && <p style={S.error}>{errors.target.message}</p>}
                </div>
                <div>
                  <label style={S.label}>Weightage (%) *</label>
                  <input {...register('weightage')} type="number" step="0.1" min="0.1" max="100" style={S.input} onFocus={focusStyle} onBlur={blurStyle} />
                  {errors.weightage && <p style={S.error}>{errors.weightage.message}</p>}
                </div>
              </div>
              <WeightageMeter current={usedWeightage} adding={Number(watchedWeightage) || 0} />
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Review & Submit</h2>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem' }}>
                {[
                  ['Thrust Area', values.thrustArea],
                  ['Title', values.title],
                  ['Description', values.description || '—'],
                  ['UOM', values.uomType],
                  ['Scoring', values.scoringType],
                  ['Target', values.target],
                  ...(values.deadline ? [['Deadline', values.deadline]] : []),
                  ['Weightage', `${values.weightage}%`],
                  ['Shared', values.isShared ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={String(k)} style={S.row}>
                    <span style={{ fontSize: '0.775rem', color: '#64748b' }}>{k}</span>
                    <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#e2e8f0' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
              {mutation.isError && <p style={{ ...S.error, padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.25)' }}>Failed to create goal. Check weightage total.</p>}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button type="button" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
              style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.75rem' }}>
              {step === 0 ? 'Cancel' : '← Back'}
            </button>
            {step < 3 ? (
              <button type="button" onClick={next} className="btn-primary">Next →</button>
            ) : (
              <button type="submit" disabled={mutation.isPending} className="btn-success">
                {mutation.isPending ? 'Saving…' : 'Create Goal'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
