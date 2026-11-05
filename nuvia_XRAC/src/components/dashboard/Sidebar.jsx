import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Users, FileText, Settings, Sparkles } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: Home, end: true },
  { to: '/dashboard/pacientes', label: 'Pacientes', icon: Users },
  { to: '/dashboard/reportes', label: 'Reportes', icon: FileText },
  { to: '/dashboard/configuracion', label: 'Configuración', icon: Settings }
]

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-mist-200 bg-white px-4 py-6 sm:flex">
      <div className="mb-9 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-nuvia-600 text-white">
          <Sparkles size={17} strokeWidth={2.25} />
        </div>
        <div>
          <p className="font-display text-base font-extrabold leading-tight tracking-tight text-ink-900">NUVIA</p>
          <p className="text-[11px] leading-tight text-ink-300">Preparación de consultas</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-nuvia-50 text-nuvia-700' : 'text-ink-500 hover:bg-mist-100 hover:text-ink-900'
              }`
            }
          >
            <item.icon size={18} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <p className="px-2 text-[11px] leading-snug text-ink-300">
        Apoyo para preparar la consulta. No sustituye el criterio médico.
      </p>
    </aside>
  )
}
