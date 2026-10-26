import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Users, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: Home, end: true },
  { to: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/dashboard/pacientes', label: 'Pacientes', icon: Users },
  { to: '/dashboard/configuracion', label: 'Ajustes', icon: Settings }
]

// A compact bottom tab bar so the dashboard stays usable on narrow screens,
// where the full sidebar (components/dashboard/Sidebar.jsx) is hidden.
export default function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-mist-200 bg-white/95 backdrop-blur sm:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
              isActive ? 'text-nuvia-600' : 'text-ink-300'
            }`
          }
        >
          <item.icon size={18} strokeWidth={2.15} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
