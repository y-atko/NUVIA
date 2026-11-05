import React from 'react'
import SourceChip from '../record/SourceChip.jsx'
import ReportSection from './ReportSection.jsx'
import { formatDisplayDate } from '../../utils/dateHelpers.js'

// Muestra un reporte: sus secciones, las observaciones del profesional y las fuentes citadas.
// `sections` y `observations` pueden ser el buffer en edición o una versión histórica (solo lectura).
export default function ReportView({ sections, observations, sources, editing, dispatch, onOpenSource }) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <ReportSection key={section.key} section={section} editing={editing} dispatch={dispatch} onOpenSource={onOpenSource} />
      ))}

      <section aria-labelledby="report-observations" className="rounded-xl2 border border-ink-100 bg-white p-5 sm:p-6">
        <h3 id="report-observations" className="font-display text-base font-bold text-ink-900">Observaciones del profesional</h3>
        {editing ? (
          <textarea
            aria-label="Observaciones del profesional"
            value={observations}
            onChange={(e) => dispatch({ type: 'setObservations', text: e.target.value })}
            rows={3}
            placeholder="Notas propias sobre este reporte"
            className="mt-3 w-full resize-y rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:border-nuvia-500"
          />
        ) : observations.trim() ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-900">{observations}</p>
        ) : (
          <p className="mt-2 text-sm text-ink-500">Sin observaciones.</p>
        )}
      </section>

      <section aria-labelledby="report-sources" className="rounded-xl2 border border-ink-100 bg-white p-5 sm:p-6">
        <h3 id="report-sources" className="font-display text-base font-bold text-ink-900">
          Fuentes de información <span className="text-sm font-normal text-ink-300">({sources.length})</span>
        </h3>
        {sources.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">El reporte no incluye fuentes.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sources.map((source) => (
              <li key={source.id} className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <SourceChip source={source} onOpen={onOpenSource} />
                {source.field && <span>{source.field}</span>}
                {source.date && <span>{formatDisplayDate(source.date)}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
