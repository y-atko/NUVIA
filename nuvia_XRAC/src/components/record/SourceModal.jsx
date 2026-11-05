import React from 'react'
import Modal from '../ui/Modal.jsx'
import { findRecordForSource } from '../../api/normalize.js'
import { formatDisplayDate } from '../../utils/dateHelpers.js'

const NOT_PROVIDED = 'No informado'

function Row({ label, value }) {
  return (
    <>
      <dt className="text-ink-300">{label}</dt>
      <dd className={value ? 'text-ink-900' : 'text-ink-300'}>{value || NOT_PROVIDED}</dd>
    </>
  )
}

// Detalle de un registro de origen: lo que dice la referencia y, si el backend lo envió,
// el registro original completo.
export default function SourceModal({ source, records, onClose }) {
  if (!source) return null
  if (source.kind === 'input' || source.kind === 'transcription') {
    return <ConsultationSourceModal source={source} onClose={onClose} />
  }
  const fullRecord = findRecordForSource(records, source)

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-lg"
      title="Registro de origen"
      subtitle={[source.table, source.recordId].filter(Boolean).join(' / ') || undefined}
    >
      <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm">
        <Row label="Tabla" value={source.table} />
        <Row label="Registro" value={source.recordId} />
        <Row label="Campo" value={source.field} />
        <Row label="Fecha" value={formatDisplayDate(source.date)} />
      </dl>

      <h4 className="mt-5 text-sm font-semibold text-ink-900">Fragmento citado</h4>
      {source.excerpt ? (
        <blockquote className="mt-2 rounded-lg border-l-2 border-nuvia-300 bg-mist-50 px-4 py-3 text-sm text-ink-700">
          {source.excerpt}
        </blockquote>
      ) : (
        <p className="mt-2 text-sm text-ink-500">El backend no incluyó un fragmento de este registro.</p>
      )}

      <h4 className="mt-5 text-sm font-semibold text-ink-900">Registro completo</h4>
      {fullRecord ? (
        fullRecord.fields.length > 0 ? (
          <dl className="mt-2 grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-1.5 rounded-lg border border-mist-200 p-3 text-sm">
            {fullRecord.fields.map((field) => (
              <React.Fragment key={field.label}>
                <dt className="truncate text-ink-300" title={field.label}>{field.label}</dt>
                <dd className={field.value ? 'break-words text-ink-900' : 'text-ink-300'}>
                  {field.value || '(vacío)'}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-ink-500">El registro llegó sin campos.</p>
        )
      ) : (
        <p className="mt-2 text-sm text-ink-500">
          El backend no incluyó el registro completo; solo está disponible la referencia de arriba.
        </p>
      )}
    </Modal>
  )
}

// Información que NO viene del expediente: la aportó el profesional en la consulta.
function ConsultationSourceModal({ source, onClose }) {
  const isTranscription = source.kind === 'transcription'
  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-lg"
      title={isTranscription ? 'Transcripción de audio' : 'Información de la consulta'}
      subtitle="No proviene del expediente clínico"
    >
      <p className="text-sm text-ink-700">
        {isTranscription
          ? 'Texto transcrito de un audio y revisado por el profesional antes de usarse en el reporte.'
          : 'Texto escrito por el profesional durante la consulta y revisado antes de usarse en el reporte.'}
      </p>
      {source.label && <p className="mt-2 text-xs text-ink-500">{source.label}</p>}
      <h4 className="mt-5 text-sm font-semibold text-ink-900">Texto utilizado</h4>
      {source.excerpt ? (
        <blockquote className="mt-2 whitespace-pre-wrap rounded-lg border-l-2 border-nuvia-300 bg-mist-50 px-4 py-3 text-sm text-ink-700">
          {source.excerpt}
        </blockquote>
      ) : (
        <p className="mt-2 text-sm text-ink-500">El backend no incluyó el texto utilizado.</p>
      )}
    </Modal>
  )
}
