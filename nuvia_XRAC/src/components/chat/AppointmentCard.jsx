import React from 'react'
import { Check } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'

export default function AppointmentCard({ title, rows, status, actionLabel, onAction, actionDone, actionVariant = 'primary' }) {
  return (
    <div className="w-full rounded-xl2 border border-ink-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
        {status && <Badge status={status} />}
      </div>
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-ink-300">{row.label}</dt>
            <dd className="font-medium text-ink-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      {actionLabel && (
        <div className="mt-4">
          {actionDone ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-nuvia-600">
              <Check size={16} strokeWidth={2.5} />
              Listo
            </div>
          ) : (
            <Button variant={actionVariant} size="sm" className="w-full" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
