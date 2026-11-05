import React from 'react'
import { scrollToId } from '../../utils/scroll.js'

// Atajos para llegar rápido a cada parte del expediente. Se queda visible al desplazarse.
export default function SectionNav({ sections, alertCount, hasRecords }) {
  const links = [
    ...sections.map((s) => ({ id: `sec-${s.key}`, label: s.title, count: s.items.length })),
    { id: 'alerts', label: 'Alertas', count: alertCount },
    hasRecords && { id: 'records', label: 'Registros originales' }
  ].filter(Boolean)

  return (
    <nav aria-label="Secciones del expediente" className="sticky top-0 z-10 -mx-1 bg-mist-50/95 px-1 py-2 backdrop-blur">
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {links.map((link) => (
          <li key={link.id} className="shrink-0">
            <button
              type="button"
              onClick={() => scrollToId(link.id, 'start')}
              className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-inset ring-ink-100 transition-colors hover:bg-nuvia-50 hover:text-nuvia-700"
            >
              {link.label}
              {link.count !== undefined && <span className="ml-1.5 text-ink-300">{link.count}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
