import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { predictEligibility, PredictRequest, EMPLOYMENT_STATUSES, EDUCATION_LEVELS, DISABILITY_VALUES } from '../api/client'
import { toast } from 'sonner'
import { Zap, CheckCircle, XCircle } from 'lucide-react'

const inputCls = 'w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/60'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      {children}
    </div>
  )
}

const DEFAULT: PredictRequest = {
  age: 25,
  family_income: 120000,
  family_members: 4,
  employment_status: 'Unemployed',
  education_level: 'Secondary',
  disability_status: 'No',
  algorithm: 'random_forest',
}

export default function Predict() {
  const [form, setForm] = useState<PredictRequest>(DEFAULT)
  const set = <K extends keyof PredictRequest>(k: K, v: PredictRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const { mutate, data: result, isPending, reset } = useMutation({
    mutationFn: predictEligibility,
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e.response?.data?.detail ?? 'Prediction failed — make sure the model is trained first'),
  })

  const isEligible = result?.prediction === 'Eligible'

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Predict Eligibility</h1>
        <p className="text-sm text-gray-400 mt-1">Enter applicant details to get an AI-powered eligibility decision</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Applicant Information</h2>

          <Field label="Age">
            <input type="number" className={inputCls} value={form.age}
              onChange={e => set('age', +e.target.value)} min={5} max={100} />
          </Field>

          <Field label="Family Income (₹)">
            <input type="number" className={inputCls} value={form.family_income}
              onChange={e => set('family_income', +e.target.value)} min={0} />
          </Field>

          <Field label="Family Members">
            <input type="number" className={inputCls} value={form.family_members}
              onChange={e => set('family_members', +e.target.value)} min={1} max={20} />
          </Field>

          <Field label="Employment Status">
            <select className={inputCls} value={form.employment_status}
              onChange={e => set('employment_status', e.target.value)}>
              {EMPLOYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Education Level">
            <select className={inputCls} value={form.education_level}
              onChange={e => set('education_level', e.target.value)}>
              {EDUCATION_LEVELS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Disability Status">
            <select className={inputCls} value={form.disability_status}
              onChange={e => set('disability_status', e.target.value)}>
              {DISABILITY_VALUES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Algorithm">
            <select className={inputCls} value={form.algorithm}
              onChange={e => set('algorithm', e.target.value as PredictRequest['algorithm'])}>
              <option value="random_forest">Random Forest</option>
              <option value="decision_tree">Decision Tree</option>
            </select>
          </Field>

          <button
            onClick={() => { reset(); mutate(form) }}
            disabled={isPending}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-medium text-sm transition-colors"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isPending ? 'Predicting…' : 'Predict Eligibility'}
          </button>
        </div>

        {/* Result */}
        <div className="flex flex-col gap-4">
          {result ? (
            <div className={`glass rounded-xl p-6 border ${isEligible ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center gap-3 mb-5">
                {isEligible
                  ? <CheckCircle className="w-10 h-10 text-green-400" />
                  : <XCircle className="w-10 h-10 text-red-400" />}
                <div>
                  <p className="text-xs text-gray-400">Prediction Result</p>
                  <p className={`text-2xl font-bold ${isEligible ? 'text-green-400' : 'text-red-400'}`}>
                    {result.prediction}
                  </p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Confidence</span>
                  <span className="font-medium text-white">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isEligible ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400">
                <span className="text-gray-500">Algorithm: </span>
                <span className="text-gray-300 capitalize">{result.algorithm_used.replace('_', ' ')}</span>
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl p-6 flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-3">
              <Zap className="w-8 h-8 text-gray-600" />
              <p className="text-sm text-gray-500">Fill in the form and click Predict to see the AI decision</p>
              <p className="text-xs text-gray-600">Make sure the model is trained first (Training page)</p>
            </div>
          )}

          {/* Input summary */}
          {result && (
            <div className="glass rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-400 mb-2">Input Summary</p>
              {[
                ['Age', form.age],
                ['Income', `₹${form.family_income.toLocaleString()}`],
                ['Family Members', form.family_members],
                ['Employment', form.employment_status],
                ['Education', form.education_level],
                ['Disability', form.disability_status],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between text-xs">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-300">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
