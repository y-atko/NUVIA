import React from 'react'
import Badge from '../ui/Badge.jsx'
import { STAGES, stageOf } from '../../report/reportStatus.js'

// Borrador / En revisión / Confirmado, igual en todas las pantallas.
export default function ReportStatusBadge({ status, children }) {
  const stage = STAGES[stageOf(status)]
  return <Badge tone={stage.tone}>{children || stage.label}</Badge>
}
