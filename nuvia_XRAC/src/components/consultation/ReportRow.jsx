import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import ReportStatusBadge from './ReportStatusBadge.jsx'
import { formatDateTime, formatDisplayDate } from '../../utils/dateHelpers.js'

// Fecha corta (sin hora) para columnas estrechas; si no es una fecha ISO, se muestra tal cual.
const formatShort = (value) => formatDisplayDate(String(value).slice(0, 10)) || String(value)

// Fila de un reporte en las listas del panel principal. Abre la preparación de consulta del paciente.
export default function ReportRow({ report, compact = false }) {
  return (
    <li>
      <Link
        to={`/dashboard/pacientes/${encodeURIComponent(report.patientId)}/consulta`}
        className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-mist-50"
      >
        <Avatar name={report.patientLabel} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900">{report.patientLabel}</span>
          <span className="block truncate text-xs text-ink-500">
            {report.updatedAt ? (compact ? formatShort(report.updatedAt) : `Actualizado ${formatDateTime(report.updatedAt)}`) : 'Sin fecha de actualización'}
          </span>
        </span>
        <ReportStatusBadge status={report.status} />
        <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  )
}
