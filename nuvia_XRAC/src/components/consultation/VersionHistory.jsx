import React from 'react'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import { LoadingState, ErrorState } from '../ui/StatusView.jsx'
import { formatDateTime } from '../../utils/dateHelpers.js'

const STATUS_TONE = { generated: 'initial', draft: 'draft', in_review: 'in_review', confirmed: 'confirmed' }
const STATUS_LABEL = { generated: 'Versión inicial', draft: 'Borrador guardado', in_review: 'Enviado a revisión', confirmed: 'Confirmado' }

// Historial que conserva el backend. Cada versión se puede abrir en modo solo lectura.
export default function VersionHistory({ versions, onRetry, onOpen }) {
  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-5">
      <h3 className="font-display text-base font-bold text-ink-900">Historial de versiones</h3>
      {versions.status === 'loading' && <LoadingState label="Cargando historial…" className="py-6" />}
      {versions.status === 'error' && <ErrorState error={versions.error} onRetry={onRetry} className="mt-3" />}
      {versions.status === 'success' && versions.items.length === 0 && (
        <p className="mt-2 text-sm text-ink-500">El backend no devolvió versiones para este reporte.</p>
      )}
      {versions.status === 'success' && versions.items.length > 0 && (
        <ul className="mt-3 divide-y divide-mist-100">
          {versions.items.map((v) => (
            <li key={v.version} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-900">
                  Versión {v.version}
                  <Badge tone={STATUS_TONE[v.status]}>{STATUS_LABEL[v.status]}</Badge>
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {[formatDateTime(v.savedAt), v.savedBy].filter(Boolean).join(', ') || 'Sin fecha ni autor informados'}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onOpen(v.version)}>Ver</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
