import { useQuery } from '@tanstack/react-query'
import { getAnalytics, getIncomeDistribution } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Users, CheckCircle, XCircle, DollarSign, User, Home } from 'lucide-react'

const COLORS = { Eligible: '#22c55e', 'Not Eligible': '#ef4444' }
const PIE_COLORS = ['#22c55e', '#ef4444']

function StatCard({ icon: Icon, label, value, color = 'text-white' }: {
  icon: React.ElementType; label: string; value: string | number; color?: string
}) {
  return (
    <div className="glass rounded-xl p-5 flex items-start gap-4">
      <div className="p-2 rounded-lg bg-white/10">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  })

  const { data: incomeDist } = useQuery({
    queryKey: ['income-dist'],
    queryFn: getIncomeDistribution,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!analytics) return null

  const eligibilityData = [
    { name: 'Eligible', value: analytics.eligible_count },
    { name: 'Not Eligible', value: analytics.not_eligible_count },
  ]

  const employmentData = Object.entries(analytics.employment_breakdown).map(([name, value]) => ({ name, value }))
  const educationData = Object.entries(analytics.education_breakdown).map(([name, value]) => ({ name, value }))

  const incomeChartData = incomeDist
    ? Object.entries(incomeDist).map(([range, vals]) => ({
        range,
        Eligible: (vals as Record<string, number>)['Eligible'] ?? 0,
        'Not Eligible': (vals as Record<string, number>)['Not Eligible'] ?? 0,
      }))
    : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">NGO Beneficiary Eligibility Overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users}       label="Total Applicants"   value={analytics.total_applicants} />
        <StatCard icon={CheckCircle} label="Eligible"           value={analytics.eligible_count}   color="text-green-400" />
        <StatCard icon={XCircle}     label="Not Eligible"       value={analytics.not_eligible_count} color="text-red-400" />
        <StatCard icon={DollarSign}  label="Avg Income"         value={`₹${(analytics.average_income / 1000).toFixed(0)}K`} />
        <StatCard icon={User}        label="Avg Age"            value={`${analytics.average_age.toFixed(1)} yrs`} />
        <StatCard icon={Home}        label="Avg Family Members" value={analytics.average_family_members.toFixed(1)} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Eligibility pie */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Eligibility Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={eligibilityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {eligibilityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Employment breakdown */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Employment Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={employmentData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={85} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none' }} />
              <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Education breakdown */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Education Level</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={educationData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={105} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income distribution chart */}
      {incomeChartData.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Income Distribution vs Eligibility</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeChartData}>
              <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none' }} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="Eligible" stackId="a" fill={COLORS['Eligible']} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Not Eligible" stackId="a" fill={COLORS['Not Eligible']} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
