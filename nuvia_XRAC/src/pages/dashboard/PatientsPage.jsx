import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import PatientDetailModal from '../../components/dashboard/PatientDetailModal.jsx'
import { useAppState } from '../../context/AppContext.jsx'
import { getLastAppointment, getNextAppointment } from '../../utils/appointmentLogic.js'
import { formatDateShort } from '../../utils/dateHelpers.js'

export default function PatientsPage() {
  const { patients, appointments } = useAppState()
  const [query, setQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const rows = useMemo(() => {
    return patients
      .map((patient) => ({
        patient,
        last: getLastAppointment(appointments, patient.id),
        next: getNextAppointment(appointments, patient.id)
      }))
      .filter((row) => row.patient.name.toLowerCase().includes(query.trim().toLowerCase()))
  }, [patients, appointments, query])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Pacientes</h1>
          <p className="mt-1 text-sm text-ink-500">{patients.length} pacientes registrados.</p>
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paciente…"
            className="w-56 rounded-xl border border-ink-100 bg-white py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-nuvia-400"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-ink-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-mist-200 text-xs uppercase tracking-wide text-ink-300">
              <th className="px-5 py-3 font-medium">Paciente</th>
              <th className="px-5 py-3 font-medium">Última cita</th>
              <th className="px-5 py-3 font-medium">Próxima cita</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ patient, last, next }) => (
              <tr
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="cursor-pointer border-b border-mist-100 last:border-0 hover:bg-mist-50"
              >
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink-900">{patient.name}</p>
                  {patient.phone && <p className="text-xs text-ink-300">{patient.phone}</p>}
                </td>
                <td className="px-5 py-3.5 text-ink-500">
                  {last ? formatDateShort(last.date) : '—'}
                </td>
                <td className="px-5 py-3.5 text-ink-500">
                  {next ? `${formatDateShort(next.date)} · ${next.time}` : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-sm text-ink-300">
                  No se encontraron pacientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PatientDetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
    </div>
  )
}
