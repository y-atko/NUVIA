import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Users, Settings, Sparkles, MessageCircle } from 'lucide-react'
import { CLINIC } from '../../data/mockData.js'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: Home, end: true },
  { to: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/dashboard/pacientes', label: 'Pacientes', icon: Users },
  { to: '/dashboard/configuracion', label: 'Configuración', icon: Settings }
]

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-mist-200 bg-white px-4 py-6 sm:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-nuvia-500 to-sky-500 text-white shadow-sm">
          <Sparkles size={16} strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-ink-900">NUVIA</p>
          <p className="text-[11px] leading-tight text-ink-300">Panel de la clínica</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-nuvia-50 text-nuvia-700'
                  : 'text-ink-500 hover:bg-mist-100 hover:text-ink-900'
              }`
            }
          >
            <item.icon size={17} strokeWidth={2.15} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/chat"
        className="flex items-center gap-2.5 rounded-xl border border-ink-100 px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:border-nuvia-300 hover:text-nuvia-700"
      >
        <MessageCircle size={17} strokeWidth={2.15} />
        Ver chat del paciente
      </NavLink>

      <p className="mt-4 px-2 text-[11px] leading-snug text-ink-300">{CLINIC.name}</p>
    </aside>
  )
}
