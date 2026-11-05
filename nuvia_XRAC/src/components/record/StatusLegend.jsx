import React from 'react'
import Badge from '../ui/Badge.jsx'

const ITEMS = [
  ['documented', 'El dato tiene al menos un registro de origen identificado.'],
  ['review', 'Tiene fuente, pero conviene confirmarlo antes de apoyarse en él.'],
  ['unverified', 'No llegó un registro de origen válido, por lo que no se presenta como confirmado.'],
  ['missing', 'El expediente no contiene el dato. Eso no implica que no exista clínicamente.'],
  ['contradiction', 'Dos registros dicen cosas distintas y hay que confirmar cuál aplica.']
]

export default function StatusLegend() {
  return (
    <ul className="space-y-3">
      {ITEMS.map(([tone, text]) => (
        <li key={tone} className="flex flex-wrap items-start gap-x-3 gap-y-1">
          <span className="w-44 shrink-0">
            <Badge tone={tone} />
          </span>
          <span className="min-w-0 flex-1 text-sm text-ink-700">{text}</span>
        </li>
      ))}
    </ul>
  )
}
