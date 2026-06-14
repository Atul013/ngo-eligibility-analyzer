import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getBeneficiaries, deleteBeneficiary, createBeneficiary, updateBeneficiary,
  Beneficiary, BeneficiaryCreate,
  EMPLOYMENT_STATUSES, EDUCATION_LEVELS, DISABILITY_VALUES, ELIGIBILITY_VALUES,
} from '../api/client'
import { Trash2, Plus, Pencil, X, Search, Upload } from 'lucide-react'
import { uploadCSV } from '../api/client'

const EMPTY: BeneficiaryCreate = {
  applicant_name: '', age: 22, family_income: 120000, family_members: 4,
  employment_status: 'Unemployed', education_level: 'Secondary',
  disability_status: 'No', eligibility_status: 'Eligible',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500/60'

function BeneficiaryModal({ initial, onClose, onSave }: {
  initial: Partial<BeneficiaryCreate> & { id?: number }
  onClose: () => void
  onSave: (data: BeneficiaryCreate) => void
}) {
  const [form, setForm] = useState<BeneficiaryCreate>({ ...EMPTY, ...initial })
  const set = (k: keyof BeneficiaryCreate, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">{initial.id ? 'Edit Beneficiary' : 'Add Beneficiary'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name">
            <input className={inputCls} value={form.applicant_name} onChange={e => set('applicant_name', e.target.value)} />
          </Field>
          <Field label="Age">
            <input type="number" className={inputCls} value={form.age} onChange={e => set('age', +e.target.value)} />
          </Field>
          <Field label="Family Income (₹)">
            <input type="number" className={inputCls} value={form.family_income} onChange={e => set('family_income', +e.target.value)} />
          </Field>
          <Field label="Family Members">
            <input type="number" className={inputCls} value={form.family_members} onChange={e => set('family_members', +e.target.value)} />
          </Field>
          <Field label="Employment Status">
            <select className={inputCls} value={form.employment_status} onChange={e => set('employment_status', e.target.value)}>
              {EMPLOYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Education Level">
            <select className={inputCls} value={form.education_level} onChange={e => set('education_level', e.target.value)}>
              {EDUCATION_LEVELS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Disability">
            <select className={inputCls} value={form.disability_status} onChange={e => set('disability_status', e.target.value)}>
              {DISABILITY_VALUES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Eligibility">
            <select className={inputCls} value={form.eligibility_status} onChange={e => set('eligibility_status', e.target.value)}>
              {ELIGIBILITY_VALUES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/15 text-gray-300">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 text-sm rounded-lg bg-green-500 hover:bg-green-400 text-white font-medium">Save</button>
        </div>
      </div>
    </div>
  )
}

export default function Beneficiaries() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterEligibility, setFilterEligibility] = useState('')
  const [modal, setModal] = useState<null | Partial<BeneficiaryCreate> & { id?: number }>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['beneficiaries', search, filterEligibility],
    queryFn: () => getBeneficiaries({ search: search || undefined, eligibility: filterEligibility || undefined, limit: 200 }),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['beneficiaries'] })

  const createMut = useMutation({
    mutationFn: createBeneficiary,
    onSuccess: () => { invalidate(); setModal(null); toast.success('Beneficiary added') },
    onError: () => toast.error('Failed to add beneficiary'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BeneficiaryCreate> }) => updateBeneficiary(id, data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Beneficiary updated') },
    onError: () => toast.error('Failed to update'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteBeneficiary,
    onSuccess: () => { invalidate(); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const uploadMut = useMutation({
    mutationFn: uploadCSV,
    onSuccess: (res) => { invalidate(); toast.success(`Imported ${res.inserted} records`) },
    onError: () => toast.error('CSV upload failed'),
  })

  const handleSave = (data: BeneficiaryCreate) => {
    if (modal?.id) updateMut.mutate({ id: modal.id, data })
    else createMut.mutate(data)
  }

  const eligibilityBadge = (s: string) =>
    s === 'Eligible'
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : 'bg-red-500/20 text-red-400 border border-red-500/30'

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Beneficiaries</h1>
          <p className="text-sm text-gray-400 mt-1">{data.length} records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* CSV Upload */}
          <label className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload CSV
            <input type="file" accept=".csv" className="hidden" onChange={e => {
              const f = e.target.files?.[0]
              if (f) uploadMut.mutate(f)
              e.target.value = ''
            }} />
          </label>
          <button onClick={() => setModal(EMPTY)} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-500 hover:bg-green-400 text-white font-medium">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="w-full bg-gray-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/60"
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          value={filterEligibility}
          onChange={e => setFilterEligibility(e.target.value)}
        >
          <option value="">All Eligibility</option>
          {ELIGIBILITY_VALUES.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Age</th>
                <th className="px-4 py-3 text-left">Income</th>
                <th className="px-4 py-3 text-left">Members</th>
                <th className="px-4 py-3 text-left">Employment</th>
                <th className="px-4 py-3 text-left">Education</th>
                <th className="px-4 py-3 text-left">Disability</th>
                <th className="px-4 py-3 text-left">Eligibility</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No records found</td></tr>
              ) : data.map((b: Beneficiary) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{b.applicant_name}</td>
                  <td className="px-4 py-3 text-gray-300">{b.age}</td>
                  <td className="px-4 py-3 text-gray-300">₹{b.family_income.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">{b.family_members}</td>
                  <td className="px-4 py-3 text-gray-300">{b.employment_status}</td>
                  <td className="px-4 py-3 text-gray-300">{b.education_level}</td>
                  <td className="px-4 py-3 text-gray-300">{b.disability_status}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${eligibilityBadge(b.eligibility_status)}`}>
                      {b.eligibility_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal(b)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this record?')) deleteMut.mutate(b.id) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <BeneficiaryModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
