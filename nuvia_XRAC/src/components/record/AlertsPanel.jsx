import React from 'react'
import { ShieldCheck } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import SourceChip, { MissingSourceChip } from './SourceChip.jsx'

// Tres tipos distintos: una contradicción no es lo mismo que un dato ausente.
const GROUPS = [
  { type: 'contradiction', title: 'Contradicciones entre registros', border: 'border-l-coral-500' },
  { type: 'review', title: 'Requieren revisión', border: 'border-l-amber-500' },
  {
    type: 'missing',
    title: 'Información no documentada',
    hint: 'Que un dato no aparezca en el expediente no significa que no exista clínicamente.',
    border: 'border-l-ink-300'
  }
]

function AlertCard({ alert, border, onOpenSource, onGoToClaim }) {
  return (
    <li id={`alert-${alert.id}`} className={`rounded-xl border border-mist-200 border-l-2 bg-white p-4 ${border}`}>
      <p className="text-sm font-semibold text-ink-900">{alert.title}</p>
      {alert.description && <p className="mt-1 text-sm leading-relaxed text-ink-700">{alert.description}</p>}

      {(alert.sources.length > 0 || alert.unresolvedSourceIds.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {alert.sources.map((source) => (
            <SourceChip key={source.id} source={source} onOpen={onOpenSource} />
          ))}
          {alert.unresolvedSourceIds.map((id) => (
            <MissingSourceChip key={id} id={id} />
          ))}
        </div>
      )}

      {alert.claimIds.length > 0 && (
        <button
          type="button"
          onClick={() => onGoToClaim(alert.claimIds[0])}
          className="mt-3 text-xs font-medium text-nuvia-700 hover:underline"
        >
          Ver en el resumen
        </button>
      )}
    </li>
  )
}

export default function AlertsPanel({ alerts, onOpenSource, onGoToClaim }) {
  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-5">
      <h2 className="font-display text-base font-bold text-ink-900">
        Alertas <span className="text-sm font-normal text-ink-300">({alerts.length})</span>
      </h2>

      {alerts.length === 0 ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-ink-500">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-nuvia-600" aria-hidden="true" />
          El sistema no reportó alertas para este expediente.
        </p>
      ) : (
        GROUPS.map((group) => {
          const groupAlerts = alerts.filter((a) => a.type === group.type)
          if (groupAlerts.length === 0) return null
          return (
            <div key={group.type} className="mt-5 first:mt-4">
              <div className="flex items-center gap-2">
                <Badge tone={group.type} />
                <h3 className="text-sm font-semibold text-ink-900">{group.title}</h3>
              </div>
              {group.hint && <p className="mt-1.5 text-xs text-ink-500">{group.hint}</p>}
              <ul className="mt-3 space-y-2.5">
                {groupAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    border={group.border}
                    onOpenSource={onOpenSource}
                    onGoToClaim={onGoToClaim}
                  />
                ))}
              </ul>
            </div>
          )
        })
      )}
    </div>
  )
}
