import React, { useMemo, useState } from 'react'
import { CalendarCheck, CalendarClock, BellRing } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard.jsx'
import AppointmentModal from '../../components/dashboard/AppointmentModal.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useAppState } from '../../context/AppContext.jsx'
import { getDashboardStats, getTodayAgenda } from '../../utils/appointmentLogic.js'
import { CLINIC } from '../../data/mockData.js'

export default function DashboardHome() {
  const { appointments, patients } = useAppState()
  const [selectedAppt, setSelectedAppt] = useState(null)

  const stats = useMemo(() => getDashboardStats(appointments), [appointments])
  const todayAgenda = useMemo(() => getTodayAgenda(appointments), [appointments])

  function patientName(patientId) {
    return patients.find((p) => p.id === patientId)?.name || 'Paciente'
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">
        Buenos días, {CLINIC.dentistName}
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Esto es lo que pasa hoy en {CLINIC.name}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Citas de hoy" value={stats.citasHoy} icon={CalendarCheck} tone="nuvia" />
        <StatCard label="Próximas citas" value={stats.proximasCitas} icon={CalendarClock} tone="sky" />
        <StatCard label="Pendientes de confirmar" value={stats.pendientes} icon={BellRing} tone="amber" />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-300">
          Agenda de hoy
        </h2>
        <div className="overflow-hidden rounded-xl2 border border-ink-100 bg-white">
          {todayAgenda.length === 0 ? (
            <p className="p-6 text-sm text-ink-500">No hay citas programadas para hoy.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-mist-200 text-xs uppercase tracking-wide text-ink-300">
                  <th className="px-5 py-3 font-medium">Hora</th>
                  <th className="px-5 py-3 font-medium">Paciente</th>
                  <th className="px-5 py-3 font-medium">Servicio</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {todayAgenda.map((appt) => (
                  <tr
                    key={appt.id}
                    onClick={() => setSelectedAppt(appt)}
                    className="cursor-pointer border-b border-mist-100 last:border-0 hover:bg-mist-50"
                  >
                    <td className="px-5 py-3.5 font-medium text-ink-900">{appt.time}</td>
                    <td className="px-5 py-3.5 text-ink-700">{patientName(appt.patientId)}</td>
                    <td className="px-5 py-3.5 text-ink-500">{appt.service}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AppointmentModal
        appointment={selectedAppt}
        patientName={selectedAppt ? patientName(selectedAppt.patientId) : ''}
        onClose={() => setSelectedAppt(null)}
      />
    </div>
  )
}
