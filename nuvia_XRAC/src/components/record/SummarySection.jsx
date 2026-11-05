import React from 'react'
import { ClipboardList, History, Stethoscope, Pill, Activity, HeartPulse, FileText, CalendarDays, FlaskConical } from 'lucide-react'
import ClaimItem from './ClaimItem.jsx'

// El backend decide qué secciones envía y en qué orden; el icono solo adorna las conocidas.
const ICONS = {
  motivo: ClipboardList,
  antecedentes: History,
  diagnosticos: Stethoscope,
  historial: Stethoscope,
  consultas: CalendarDays,
  estudios: FlaskConical,
  signos: Activity,
  medicamentos: Pill,
  signos_estudios: Activity,
  evolucion: HeartPulse
}

export default function SummarySection({ section, onOpenSource }) {
  const Icon = ICONS[section.key] || FileText
  const headingId = `section-${section.key}`

  return (
    <section id={`sec-${section.key}`} aria-labelledby={headingId} className="scroll-mt-16 rounded-xl2 border border-ink-100 bg-white p-5 sm:p-6">
      <h2 id={headingId} className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
        <Icon size={17} className="text-nuvia-600" aria-hidden="true" />
        {section.title}
        <span className="text-sm font-normal text-ink-300">({section.items.length})</span>
      </h2>

      {section.items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">No hay datos disponibles en esta sección.</p>
      ) : (
        <ul className="mt-2 divide-y divide-mist-100">
          {section.items.map((item) => (
            <ClaimItem key={item.id} item={item} onOpenSource={onOpenSource} />
          ))}
        </ul>
      )}
    </section>
  )
}
