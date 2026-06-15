import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { predictEligibility, PredictRequest, EMPLOYMENT_STATUSES, EDUCATION_LEVELS, DISABILITY_VALUES } from '../api/client'
import { toast } from 'sonner'
import { Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0C0C0C',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 7,
  padding: '9px 12px',
  fontSize: 13,
  color: '#F5F0E8',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontSize: 11, color: '#787068', fontWeight: 500 }}>{label}</label>
        {hint && <span style={{ fontSize: 10, color: '#5E5A55' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function FocusInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...style }}
      onFocus={e => (e.target.style.borderColor = 'rgba(196,168,130,0.35)')}
      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
    />
  )
}

function FocusSelect({ style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, ...style, cursor: 'pointer' }}
      onFocus={e => (e.target.style.borderColor = 'rgba(196,168,130,0.35)')}
      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
    />
  )
}

const DEFAULT: PredictRequest = {
  age: 25, family_income: 120000, family_members: 4,
  employment_status: 'Unemployed', education_level: 'Secondary',
  disability_status: 'No', algorithm: 'random_forest',
}

const card: React.CSSProperties = {
  background: '#181818',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
}

export default function Predict() {
  const [form, setForm] = useState<PredictRequest>(DEFAULT)
  const set = <K extends keyof PredictRequest>(k: K, v: PredictRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const { mutate, data: result, isPending, reset } = useMutation({
    mutationFn: predictEligibility,
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e.response?.data?.detail ?? 'Prediction failed — train the model first'),
  })

  const isEligible = result?.prediction === 'Eligible'
  const pct = result ? result.confidence * 100 : 0

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ margin: '0 0 2px', fontSize: 11, color: '#5E5A55', letterSpacing: '0.12em', textTransform: 'uppercase' }}>ML Inference</p>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.02em' }}>Predict Eligibility</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Form */}
        <div style={{ ...card, padding: '20px 20px' }}>
          <p style={{ margin: '0 0 16px', fontSize: 11, color: '#5E5A55', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Applicant Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Age" hint="5–100">
                <FocusInput type="number" value={form.age} min={5} max={100} onChange={e => set('age', +e.target.value)} />
              </Field>
              <Field label="Family Members" hint="1–20">
                <FocusInput type="number" value={form.family_members} min={1} max={20} onChange={e => set('family_members', +e.target.value)} />
              </Field>
            </div>
            <Field label="Annual Family Income (₹)">
              <FocusInput type="number" value={form.family_income} min={0} onChange={e => set('family_income', +e.target.value)} />
            </Field>
            <Field label="Employment Status">
              <FocusSelect value={form.employment_status} onChange={e => set('employment_status', e.target.value)}>
                {EMPLOYMENT_STATUSES.map(s => <option key={s} style={{ background: '#181818' }}>{s}</option>)}
              </FocusSelect>
            </Field>
            <Field label="Education Level">
              <FocusSelect value={form.education_level} onChange={e => set('education_level', e.target.value)}>
                {EDUCATION_LEVELS.map(s => <option key={s} style={{ background: '#181818' }}>{s}</option>)}
              </FocusSelect>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Disability">
                <FocusSelect value={form.disability_status} onChange={e => set('disability_status', e.target.value)}>
                  {DISABILITY_VALUES.map(s => <option key={s} style={{ background: '#181818' }}>{s}</option>)}
                </FocusSelect>
              </Field>
              <Field label="Algorithm">
                <FocusSelect value={form.algorithm} onChange={e => set('algorithm', e.target.value as PredictRequest['algorithm'])}>
                  <option value="random_forest" style={{ background: '#181818' }}>Random Forest</option>
                  <option value="decision_tree" style={{ background: '#181818' }}>Decision Tree</option>
                </FocusSelect>
              </Field>
            </div>

            <button
              onClick={() => { reset(); mutate(form) }}
              disabled={isPending}
              style={{
                marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: '#F5F0E8', border: 'none', borderRadius: 7,
                padding: '10px 16px', fontSize: 13, fontWeight: 500,
                color: '#0C0C0C', cursor: isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: isPending ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => !isPending && (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = isPending ? '0.5' : '1')}
            >
              {isPending
                ? <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0C0C0C', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <Zap size={13} strokeWidth={2.2} />}
              {isPending ? 'Analysing…' : 'Run Prediction'}
            </button>
          </div>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {result ? (
            <>
              <div style={{
                ...card,
                padding: '22px 22px',
                borderColor: isEligible ? 'rgba(196,168,130,0.2)' : 'rgba(61,53,48,0.8)',
                background: isEligible ? 'rgba(196,168,130,0.05)' : '#181818',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: isEligible ? 'rgba(196,168,130,0.12)' : 'rgba(61,53,48,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isEligible
                      ? <CheckCircle size={18} color="#C4A882" strokeWidth={1.8} />
                      : <XCircle size={18} color="#787068" strokeWidth={1.8} />}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 10, color: '#5E5A55', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Result</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', color: isEligible ? '#C4A882' : '#787068' }}>
                      {result.prediction}
                    </p>
                  </div>
                </div>

                {/* Confidence */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#5E5A55' }}>Confidence</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#F5F0E8' }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999,
                      width: `${pct}%`,
                      background: isEligible ? '#C4A882' : '#5E5A55',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 10, color: '#5E5A55' }}>
                    via <span style={{ color: '#787068', textTransform: 'capitalize' }}>{result.algorithm_used.replace(/_/g, ' ')}</span>
                  </p>
                </div>
              </div>

              {/* Input recap */}
              <div style={{ ...card, padding: '16px 18px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 10, color: '#5E5A55', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Input Used</p>
                {[
                  ['Age', `${form.age} years`],
                  ['Income', `₹${form.family_income.toLocaleString()}`],
                  ['Family Members', form.family_members],
                  ['Employment', form.employment_status],
                  ['Education', form.education_level],
                  ['Disability', form.disability_status],
                ].map(([k, v]) => (
                  <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: 12, color: '#5E5A55' }}>{k}</span>
                    <span style={{ fontSize: 12, color: '#F5F0E8' }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ ...card, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, flex: 1 }}>
              <AlertCircle size={24} color="#3D3530" strokeWidth={1.5} />
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#787068' }}>No prediction yet</p>
                <p style={{ margin: 0, fontSize: 11, color: '#5E5A55' }}>Fill in the form and run a prediction</p>
                <p style={{ margin: '8px 0 0', fontSize: 10, color: '#3D3530' }}>Train the model first on the Training page</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
