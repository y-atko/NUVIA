import React from 'react'
import Badge, { CLAIM_TONE } from '../ui/Badge.jsx'
import SourceChip, { MissingSourceChip } from './SourceChip.jsx'
import { formatDisplayDate } from '../../utils/dateHelpers.js'

// El borde izquierdo codifica el estado: solo lo que no está plenamente respaldado llama la atención.
const BORDER = {
  documented: 'border-l-nuvia-100',
  needs_review: 'border-l-amber-500',
  unverified: 'border-l-ink-300 border-dashed'
}

export default function ClaimItem({ item, onOpenSource }) {
  const date = formatDisplayDate(item.date)
  return (
    <li id={`claim-${item.id}`} className={`border-l-2 py-3 pl-4 ${BORDER[item.displayStatus]}`}>
      <p className="text-sm leading-relaxed text-ink-900">{item.text || 'Elemento sin texto'}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={CLAIM_TONE[item.displayStatus]} />
        {date && <span className="text-xs text-ink-500">{date}</span>}
        {item.sources.map((source) => (
          <SourceChip key={source.id} source={source} onOpen={onOpenSource} />
        ))}
        {item.unresolvedSourceIds.map((id) => (
          <MissingSourceChip key={id} id={id} />
        ))}
      </div>

      {item.displayStatus === 'unverified' && (
        <p className="mt-2 text-xs text-ink-500">
          No llegó un registro de origen válido para este dato, así que no se presenta como confirmado.
        </p>
      )}
    </li>
  )
}
