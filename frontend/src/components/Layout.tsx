import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, Brain, Zap, Heart,
} from 'lucide-react'

const nav = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/beneficiaries',label: 'Beneficiaries', icon: Users },
  { to: '/predict',      label: 'Predict',       icon: Zap },
  { to: '/training',     label: 'Training',      icon: Brain },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/10 bg-gray-900">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <Heart className="text-green-400 w-5 h-5" />
          <span className="font-semibold text-sm tracking-wide text-white">NGO Eligibility</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-green-500/20 text-green-400 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-gray-500">Week 2 · AI + Python</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
