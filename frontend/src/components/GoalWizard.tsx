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

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#ffffff', border: '1px solid #e2e8f0',
  borderRadius: '8px', padding: '0.6rem 0.875rem', fontSize: '0.875rem',
  color: '#0f172a', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  color: '#374151', marginBottom: '0.375rem',
};

const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  (e.target as HTMLElement).style.borderColor = '#4f46e5';
  (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
};
const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  (e.target as HTMLElement).style.borderColor = '#e2e8f0';
  (e.target as HTMLElement).style.boxShadow = 'none';
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', animation: 'fadeIn 0.2s ease-out' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.75rem', gap: '0.375rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                background: i < step ? '#4f46e5' : i === step ? '#4f46e5' : '#f1f5f9',
                color: i <= step ? 'white' : '#94a3b8',
                boxShadow: i === step ? '0 0 0 4px rgba(79,70,229,0.12)' : 'none',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: i === step ? 600 : 400, color: i === step ? '#4f46e5' : '#94a3b8', whiteSpace: 'nowrap', display: 'none' }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: '2px', background: i < step ? '#4f46e5' : '#f1f5f9', borderRadius: '1px' }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          {/* Step 0 */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>Select Thrust Area</h2>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>Choose the strategic area this goal belongs to.</p>
              </div>
              <div>
                <label style={labelStyle}>Thrust Area *</label>
                <select {...register('thrustArea')} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                  <option value="">Select…</option>
                  {['Revenue Growth', 'Customer Success', 'Operational Excellence', 'People & Culture', 'Innovation', 'Compliance'].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                {errors.thrustArea && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.thrustArea.message}</p>}
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>Goal Details</h2>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>Define your goal clearly and concisely.</p>
              </div>
              <div>
                <label style={labelStyle}>Title *</label>
                <input {...register('title')} style={inputStyle} placeholder="e.g. Increase quarterly revenue by 20%" onFocus={focusStyle} onBlur={blurStyle} />
                {errors.title && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.title.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea {...register('description')} rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Optional context or details…" onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#475569', padding: '0.5rem 0.75rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <input {...register('isShared')} type="checkbox" style={{ accentColor: '#4f46e5', width: '14px', height: '14px' }} />
                This is a shared goal
              </label>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>Set Targets</h2>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>Define how success will be measured.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Unit of Measure *</label>
                  <select {...register('uomType')} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                    {[['NUMBER','Number'],['PERCENTAGE','Percentage'],['CURRENCY','Currency'],['BOOLEAN','Yes / No']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Scoring Type *</label>
                  <select {...register('scoringType')} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                    {[['MAX','MAX — higher is better'],['MIN','MIN — lower is better'],['TIMELINE','TIMELINE — by deadline'],['ZERO','ZERO — stay at zero']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {watchedScoringType === 'TIMELINE' && (
                <div>
                  <label style={labelStyle}>Deadline</label>
                  <input {...register('deadline')} type="date" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Target Value *</label>
                  <input {...register('target')} type="number" step="any" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  {errors.target && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.target.message}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Weightage (%) *</label>
                  <input {...register('weightage')} type="number" step="0.1" min="0.1" max="100" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  {errors.weightage && <p style={{ color: '#dc2626', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.weightage.message}</p>}
                </div>
              </div>
              <WeightageMeter current={usedWeightage} adding={Number(watchedWeightage) || 0} />
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem' }}>Review & Submit</h2>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: 0 }}>Confirm the details before creating your goal.</p>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
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
                ].map(([k, v], idx) => (
                  <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.875rem', borderBottom: idx < 7 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: 500 }}>{k}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
              {mutation.isError && (
                <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.8125rem' }}>
                  Failed to create goal. Check weightage total doesn't exceed 100%.
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
              className="btn-ghost" style={{ fontSize: '0.8125rem' }}>
              {step === 0 ? 'Cancel' : '← Back'}
            </button>
            {step < 3 ? (
              <button type="button" onClick={next} className="btn-primary">Continue →</button>
            ) : (
              <button type="submit" disabled={mutation.isPending} className="btn-success">
                {mutation.isPending ? 'Creating…' : 'Create Goal'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
