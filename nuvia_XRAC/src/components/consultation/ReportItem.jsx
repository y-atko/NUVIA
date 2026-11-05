import React from 'react'
import { Trash2 } from 'lucide-react'
import Badge, { CLAIM_TONE } from '../ui/Badge.jsx'
import SourceChip, { MissingSourceChip } from '../record/SourceChip.jsx'

// El borde izquierdo codifica el estado: solo lo que no está plenamente respaldado llama la atención.
const BORDER = {
  documented: 'border-l-nuvia-100',
  needs_review: 'border-l-amber-500',
  unverified: 'border-l-ink-300 border-dashed',
  missing: 'border-l-ink-300',
  professional: 'border-l-nuvia-500'
}

export default function ReportItem({ item, sectionKey, editing, dispatch, onOpenSource }) {
  return (
    <li id={`claim-${item.id}`} className={`border-l-2 py-3 pl-4 ${BORDER[item.displayStatus]}`}>
      {editing ? (
        <div className="flex items-start gap-2">
          <textarea
            aria-label={`Editar: ${item.text.slice(0, 60)}`}
            value={item.text}
            rows={Math.max(2, Math.ceil(item.text.length / 80))}
            onChange={(e) => dispatch({ type: 'editItem', sectionKey, itemId: item.id, text: e.target.value })}
            className="w-full resize-y rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm leading-relaxed text-ink-900 focus:border-nuvia-500"
          />
          <button
            type="button"
            aria-label="Eliminar este elemento"
            title="Eliminar este elemento"
            onClick={() => dispatch({ type: 'removeItem', sectionKey, itemId: item.id })}
            className="shrink-0 rounded-lg p-2 text-ink-300 hover:bg-coral-50 hover:text-coral-700"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-ink-900">{item.text || 'Elemento sin texto'}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={CLAIM_TONE[item.displayStatus]} />
        {item.edited && <Badge tone="edited" />}
        {item.sources.map((source) => (
          <SourceChip key={source.id} source={source} onOpen={onOpenSource} />
        ))}
        {item.unresolvedSourceIds.map((id) => (
          <MissingSourceChip key={id} id={id} />
        ))}
      </div>

      {item.edited && item.originalText && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-ink-500 hover:text-nuvia-700">Ver el texto original</summary>
          <p className="mt-1.5 rounded-lg bg-mist-50 px-3 py-2 text-ink-700">{item.originalText}</p>
        </details>
      )}

      {item.displayStatus === 'unverified' && (
        <p className="mt-2 text-xs text-ink-500">
          No llegó un registro de origen válido para este dato, así que no se presenta como confirmado.
        </p>
      )}
    </li>
  )
}
