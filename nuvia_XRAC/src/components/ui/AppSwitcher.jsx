import React from 'react'
import { NavLink } from 'react-router-dom'
import { MessageCircle, LayoutGrid } from 'lucide-react'

// A small, unobtrusive affordance so the prototype is easy to navigate in a
// demo: jump between the patient-facing chat and the dentist's dashboard.
export default function AppSwitcher() {
  const base =
    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors'
  const active = 'bg-ink-900 text-white'
  const inactive = 'text-ink-500 hover:text-ink-900'

  return (
    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-ink-100 bg-white/95 p-1 shadow-card backdrop-blur">
        <NavLink to="/chat" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <MessageCircle size={14} />
          Chat paciente
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
          <LayoutGrid size={14} />
          Panel doctora
        </NavLink>
      </div>
    </div>
  )
}
