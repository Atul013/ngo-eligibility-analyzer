import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getBeneficiaries, deleteBeneficiary, createBeneficiary, updateBeneficiary,
  Beneficiary, BeneficiaryCreate,
  EMPLOYMENT_STATUSES, EDUCATION_LEVELS, DISABILITY_VALUES, ELIGIBILITY_VALUES,
  uploadCSV,
} from '../api/client'
import { Trash2, Plus, Pencil, X, Search, Upload } from 'lucide-react'

const EMPTY: BeneficiaryCreate = {
  applicant_name: '', age: 22, family_income: 120000, family_members: 4,
  employment_status: 'Unemployed', education_level: 'Secondary',
  disability_status: 'No', eligibility_status: 'Eligible',
}

const inputStyle: React.CSSProperties = {
  background: '#0C0C0C',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 7,
  padding: '8px 12px',
  fontSize: 12,
  color: '#F5F0E8',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  outline: 'none',
}

function FocusInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{ ...inputStyle, ...style }}
      onFocus={e => (e.target.style.borderColor = 'rgba(196,168,130,0.35)')}
      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
    />
  )
}

function FocusSelect({ style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{ ...inputStyle, ...style, cursor: 'pointer' }}
      onFocus={e => (e.target.style.borderColor = 'rgba(196,168,130,0.35)')}
      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
    />
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, color: '#787068', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      {children}
    </div>
  )
}

function BeneficiaryModal({ initial, onClose, onSave }: {
  initial: Partial<BeneficiaryCreate> & { id?: number }
  onClose: () => void
  onSave: (data: BeneficiaryCreate) => void
}) {
  const [form, setForm] = useState<BeneficiaryCreate>({ ...EMPTY, ...initial })
  const set = (k: keyof BeneficiaryCreate, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
    }}>
      <div style={{
        background: '#181818', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, width: '100%', maxWidth: 520, padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, color: '#5E5A55', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {initial.id ? 'Edit' : 'New'} Record
            </p>
            <h2 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 500, color: '#F5F0E8' }}>
              {initial.id ? 'Edit Beneficiary' : 'Add Beneficiary'}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: '#5E5A55', display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5E5A55')}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Full Name">
              <FocusInput value={form.applicant_name} onChange={e => set('applicant_name', e.target.value)} placeholder="e.g. Priya Sharma" />
            </Field>
          </div>
          <Field label="Age">
            <FocusInput type="number" value={form.age} min={5} max={100} onChange={e => set('age', +e.target.value)} />
          </Field>
          <Field label="Family Members">
            <FocusInput type="number" value={form.family_members} min={1} max={20} onChange={e => set('family_members', +e.target.value)} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Annual Family Income (₹)">
              <FocusInput type="number" value={form.family_income} min={0} onChange={e => set('family_income', +e.target.value)} />
            </Field>
          </div>
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
          <Field label="Disability Status">
            <FocusSelect value={form.disability_status} onChange={e => set('disability_status', e.target.value)}>
              {DISABILITY_VALUES.map(s => <option key={s} style={{ background: '#181818' }}>{s}</option>)}
            </FocusSelect>
          </Field>
          <Field label="Eligibility">
            <FocusSelect value={form.eligibility_status} onChange={e => set('eligibility_status', e.target.value)}>
              {ELIGIBILITY_VALUES.map(s => <option key={s} style={{ background: '#181818' }}>{s}</option>)}
            </FocusSelect>
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 7, padding: '8px 16px', fontSize: 12, color: '#787068',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{
            background: '#F5F0E8', border: 'none', borderRadius: 7,
            padding: '8px 16px', fontSize: 12, fontWeight: 500,
            color: '#0C0C0C', cursor: 'pointer', fontFamily: 'inherit',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >Save</button>
        </div>
      </div>
    </div>
  )
}

const TH: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 10,
  color: '#5E5A55', textTransform: 'uppercase', letterSpacing: '0.1em',
  fontWeight: 500, whiteSpace: 'nowrap',
}

const TD: React.CSSProperties = {
  padding: '10px 14px', fontSize: 12, color: '#787068', whiteSpace: 'nowrap',
}

export default function Beneficiaries() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterEligibility, setFilterEligibility] = useState('')
  const [modal, setModal] = useState<null | (Partial<BeneficiaryCreate> & { id?: number })>(null)

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

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 11, color: '#5E5A55', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Records</p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.02em' }}>
            Beneficiaries
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: '#5E5A55' }}>{data.length}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 7, padding: '7px 14px', fontSize: 12, color: '#787068', fontFamily: 'inherit',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0E8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#787068')}
          >
            <Upload size={12} />
            Upload CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => {
              const f = e.target.files?.[0]
              if (f) uploadMut.mutate(f)
              e.target.value = ''
            }} />
          </label>
          <button onClick={() => setModal(EMPTY)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#F5F0E8', border: 'none', borderRadius: 7,
            padding: '7px 14px', fontSize: 12, fontWeight: 500,
            color: '#0C0C0C', cursor: 'pointer', fontFamily: 'inherit',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={12} strokeWidth={2.5} /> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} color="#5E5A55" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <FocusInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            style={{ paddingLeft: 32 }}
          />
        </div>
        <FocusSelect
          value={filterEligibility}
          onChange={e => setFilterEligibility(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="" style={{ background: '#181818' }}>All Eligibility</option>
          {ELIGIBILITY_VALUES.map(v => <option key={v} style={{ background: '#181818' }}>{v}</option>)}
        </FocusSelect>
      </div>

      {/* Table */}
      <div style={{
        background: '#181818', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Name','Age','Income','Members','Employment','Education','Disability','Eligibility',''].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} style={{ ...TD, textAlign: 'center', padding: '40px 0', color: '#5E5A55' }}>Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={9} style={{ ...TD, textAlign: 'center', padding: '40px 0', color: '#5E5A55' }}>No records found</td></tr>
              ) : data.map((b: Beneficiary, idx: number) => (
                <tr key={b.id} style={{
                  borderBottom: idx === data.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...TD, color: '#F5F0E8', fontWeight: 400 }}>{b.applicant_name}</td>
                  <td style={TD}>{b.age}</td>
                  <td style={TD}>₹{b.family_income.toLocaleString()}</td>
                  <td style={TD}>{b.family_members}</td>
                  <td style={TD}>{b.employment_status}</td>
                  <td style={TD}>{b.education_level}</td>
                  <td style={TD}>{b.disability_status}</td>
                  <td style={TD}>
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 500,
                      background: b.eligibility_status === 'Eligible' ? 'rgba(196,168,130,0.1)' : 'rgba(255,255,255,0.04)',
                      border: b.eligibility_status === 'Eligible' ? '1px solid rgba(196,168,130,0.22)' : '1px solid rgba(255,255,255,0.06)',
                      color: b.eligibility_status === 'Eligible' ? '#C4A882' : '#5E5A55',
                    }}>{b.eligibility_status}</span>
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => setModal(b)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 6px', borderRadius: 6, color: '#5E5A55', display: 'flex' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#F5F0E8' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5E5A55' }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this record?')) deleteMut.mutate(b.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 6px', borderRadius: 6, color: '#5E5A55', display: 'flex' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,168,130,0.06)'; e.currentTarget.style.color = '#C4A882' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5E5A55' }}
                      >
                        <Trash2 size={12} />
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
        <BeneficiaryModal initial={modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  )
}
