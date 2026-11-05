import React from 'react'
import { FileText, MessageSquareText, Mic } from 'lucide-react'

// Cada tipo de origen se distingue por icono y texto: lo documentado en el expediente,
// lo que el profesional escribió y lo que se transcribió de un audio.
const KINDS = {
  record: { icon: FileText },
  input: { icon: MessageSquareText, fallback: 'Información de la consulta' },
  transcription: { icon: Mic, fallback: 'Transcripción de audio' }
}

export default function SourceChip({ source, onOpen }) {
  const kind = KINDS[source.kind] || KINDS.record
  const Icon = kind.icon
  const isRecord = !source.kind || source.kind === 'record'
  return (
    <button
      type="button"
      onClick={() => onOpen(source)}
      title="Ver registro de origen"
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-2 py-1 text-xs text-ink-700 transition-colors hover:border-nuvia-300 hover:text-nuvia-700"
    >
      <Icon size={12} aria-hidden="true" className="shrink-0" />
      {isRecord ? (
        <>
          <span className="truncate font-medium">{source.table || 'Registro'}</span>
          {source.recordId && <span className="truncate text-ink-300">{source.recordId}</span>}
        </>
      ) : (
        <span className="truncate font-medium">{kind.fallback}</span>
      )}
    </button>
  )
}

// La afirmación cita un id de fuente que el backend no incluyó en `sources`.
export function MissingSourceChip({ id }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-lg border border-dashed border-amber-500/60 bg-amber-50 px-2 py-1 text-xs text-amber-700">
      <span className="truncate">Referencia no encontrada: {id}</span>
    </span>
  )
}
