import React from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from './Sidebar.jsx'

// Barra inferior para pantallas pequeñas, donde la Sidebar se oculta.
export default function MobileTabBar() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-mist-200 bg-white/95 backdrop-blur sm:hidden"
    >
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
