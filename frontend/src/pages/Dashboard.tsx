import { useQuery } from '@tanstack/react-query'
import { getAnalytics, getIncomeDistribution } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Users, CheckCircle, XCircle, DollarSign, User, Home } from 'lucide-react'

const TOOLTIP_STYLE = {
  background: '#111111',
  border: '1px solid rgba(196,168,130,0.18)',
  borderRadius: 8,
  fontSize: 12,
  color: '#F5F0E8',
  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
  padding: '8px 12px',
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string; fill: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE}>
      {label && <p style={{ margin: '0 0 6px', fontSize: 11, color: '#787068' }}>{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ margin: '2px 0', color: entry.fill || entry.color }}>
          {entry.name} : <span style={{ color: '#F5F0E8' }}>{entry.value}</span>
        </p>
      ))}
    </div>
  )
}
const AXIS_TICK = { fill: '#5E5A55', fontSize: 11, fontFamily: 'Inter Variable, sans-serif' }

const STATS = [
  { label: 'Total Applicants',   icon: Users,        key: 'total'   },
  { label: 'Eligible',           icon: CheckCircle,  key: 'eligible' },
  { label: 'Not Eligible',       icon: XCircle,      key: 'not'     },
  { label: 'Avg Income',         icon: DollarSign,   key: 'income'  },
  { label: 'Avg Age',            icon: User,         key: 'age'     },
  { label: 'Avg Family Members', icon: Home,         key: 'family'  },
]

const sectionLabel = (text: string, sub?: string) => (
  <div style={{ marginBottom: 16 }}>
    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.01em' }}>{text}</p>
    {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#5E5A55' }}>{sub}</p>}
  </div>
)

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: getAnalytics })
  const { data: incomeDist } = useQuery({ queryKey: ['income-dist'], queryFn: getIncomeDistribution })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ fontSize: 13, color: '#5E5A55' }}>Loading…</p>
    </div>
  )
  if (!analytics) return null

  const statValues = [
    String(analytics.total_applicants),
    String(analytics.eligible_count),
    String(analytics.not_eligible_count),
    `₹${(analytics.average_income / 1000).toFixed(0)}K`,
    `${analytics.average_age.toFixed(1)} yrs`,
    String(analytics.average_family_members.toFixed(1)),
  ]

  const eligibilityData = [
    { name: 'Eligible',     value: analytics.eligible_count },
    { name: 'Not Eligible', value: analytics.not_eligible_count },
  ]
  const employmentData = Object.entries(analytics.employment_breakdown)
    .sort(([,a],[,b]) => (b as number)-(a as number))
    .map(([name, value]) => ({ name, value }))
  const educationData = Object.entries(analytics.education_breakdown)
    .sort(([,a],[,b]) => (b as number)-(a as number))
    .map(([name, value]) => ({ name, value }))

  // API returns { "Eligible": { "<1L": n, … }, "Not Eligible": { … } }
  const incomeChartData = (() => {
    if (!incomeDist) return []
    const eligMap  = (incomeDist['Eligible']     ?? {}) as Record<string, number>
    const notMap   = (incomeDist['Not Eligible'] ?? {}) as Record<string, number>
    const ranges   = Object.keys(eligMap).length ? Object.keys(eligMap) : Object.keys(notMap)
    return ranges.map(r => ({ range: r, Eligible: eligMap[r] ?? 0, 'Not Eligible': notMap[r] ?? 0 }))
  })()

  const card = (style: React.CSSProperties = {}) => ({
    background: '#181818',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    ...style,
  })

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ margin: '0 0 2px', fontSize: 11, color: '#5E5A55', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Overview</p>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.02em' }}>Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 20 }}>
        {STATS.map(({ label, icon: Icon }, i) => (
          <div key={label} style={{ ...card(), padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#5E5A55' }}>{label}</p>
              <Icon size={12} color="#5E5A55" strokeWidth={1.6} />
            </div>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {statValues[i]}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Eligibility */}
        <div style={{ ...card(), padding: '20px 20px 16px' }}>
          {sectionLabel('Eligibility Split', 'Eligible vs Not Eligible')}
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={eligibilityData} dataKey="value" cx="50%" cy="50%"
                innerRadius={46} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                <Cell fill="#C4A882" />
                <Cell fill="#5E5A55" />
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
            {[['#C4A882','Eligible',analytics.eligible_count],['#5E5A55','Not Eligible',analytics.not_eligible_count]].map(([c,n,v]) => (
              <span key={String(n)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#787068' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: String(c), display: 'inline-block' }} />
                {n} ({v})
              </span>
            ))}
          </div>
        </div>

        {/* Employment */}
        <div style={{ ...card(), padding: '20px 20px 16px' }}>
          {sectionLabel('Employment Status', 'Applicant breakdown')}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={employmentData} layout="vertical" barSize={8}>
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} width={84} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="value" fill="#C4A882" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Education */}
        <div style={{ ...card(), padding: '20px 20px 16px' }}>
          {sectionLabel('Education Level', 'Applicant breakdown')}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={educationData} layout="vertical" barSize={8}>
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} width={107} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="value" fill="#787068" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income vs Eligibility */}
      {incomeChartData.length > 0 && (
        <div style={{ ...card(), padding: '20px 24px 20px' }}>
          {sectionLabel('Income Range vs Eligibility', 'Stacked count per income bracket')}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incomeChartData} barSize={30}>
              <XAxis dataKey="range" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="Eligible"     stackId="a" fill="#C4A882" />
              <Bar dataKey="Not Eligible" stackId="a" fill="#5E5A55" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            {[['#C4A882','Eligible'],['#5E5A55','Not Eligible']].map(([c,n]) => (
              <span key={n} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#5E5A55' }}>
                <span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }} />
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
