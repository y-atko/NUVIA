import React from 'react'
import { STATUS_META } from '../../utils/appointmentLogic.js'

export default function Badge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.confirmada
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}
