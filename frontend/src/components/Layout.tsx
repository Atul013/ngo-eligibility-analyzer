import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Zap, Brain } from 'lucide-react'

const nav = [
  { to: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/beneficiaries', label: 'Beneficiaries', icon: Users },
  { to: '/predict',       label: 'Predict',       icon: Zap },
  { to: '/training',      label: 'Training',      icon: Brain },
]

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0C0C0C' }}>
      {/* Sidebar */}
      <aside style={{
        width: 208,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#0E0E0E',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 18px 16px' }}>
          <p style={{ margin: '0 0 3px', fontSize: 10, color: '#5E5A55', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Week 2 · AI + Python
          </p>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#F5F0E8', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            NGO Eligibility
          </h1>
        </div>

        <div style={{ margin: '0 14px', height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 10px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 400,
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
                color: isActive ? '#C4A882' : '#787068',
                background: isActive ? 'rgba(196,168,130,0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(196,168,130,0.14)' : '1px solid transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={14} color={isActive ? '#C4A882' : '#5E5A55'} strokeWidth={1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 14px 18px' }}>
          {(() => {
            const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
            const port = new URL(base).port || '8000'
            return (
              <a
                href={`${base}/docs`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 10px', borderRadius: 7,
                  textDecoration: 'none',
                  border: '1px solid transparent',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(196,168,130,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(196,168,130,0.12)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: '#C4A882',
                  boxShadow: '0 0 6px rgba(196,168,130,0.5)',
                }} />
                <span style={{ fontSize: 11, color: '#5E5A55' }}>
                  API docs <span style={{ color: '#787068' }}>:{port}</span>
                </span>
              </a>
            )
          })()}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
