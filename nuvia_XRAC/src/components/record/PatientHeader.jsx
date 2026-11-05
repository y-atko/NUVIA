import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import ReportStatusBadge from '../consultation/ReportStatusBadge.jsx'

// "54" -> "54 años"; cualquier otro texto se muestra como llegó.
const formatAge = (age) => (age && /^\d+$/.test(age) ? `${age} años` : age)

export default function PatientHeader({ patient, reportStatus }) {
  const line = [formatAge(patient.age), patient.sex, patient.identifiers[0] ? `${patient.identifiers[0].label} ${patient.identifiers[0].value}` : `Expediente ${patient.id}`]
    .filter(Boolean)
    .join(', ')

  return (
    <header>
      <Link to="/dashboard/pacientes" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-nuvia-700">
        <ArrowLeft size={15} aria-hidden="true" />
        Pacientes
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Avatar name={patient.label} size="lg" />
        <div className="min-w-[13rem] flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">{patient.label}</h1>
          <p className="mt-0.5 text-sm text-ink-500">{line}</p>
        </div>
        {reportStatus && <ReportStatusBadge status={reportStatus} />}
      </div>
    </header>
  )
}
