import React from 'react'
import Modal from '../ui/Modal.jsx'
import Badge from '../ui/Badge.jsx'
import { useAppState } from '../../context/AppContext.jsx'
import { getLastAppointment, getNextAppointment, getPatientHistory } from '../../utils/appointmentLogic.js'
import { formatDateLong } from '../../utils/dateHelpers.js'

export default function PatientDetailModal({ patient, onClose }) {
  const { appointments } = useAppState()
  if (!patient) return null

  const last = getLastAppointment(appointments, patient.id)
  const next = getNextAppointment(appointments, patient.id)
  const history = getPatientHistory(appointments, patient.id).reverse()

  return (
    <Modal open={Boolean(patient)} onClose={onClose} title={patient.name} subtitle={patient.phone} width="max-w-lg">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-mist-50 p-4 text-sm">
          <div>
            <p className="text-ink-300">Última cita</p>
            <p className="mt-0.5 font-medium text-ink-900">
              {last ? `${formatDateLong(last.date)}` : 'Sin citas previas'}
            </p>
            {last && <p className="text-xs text-ink-300">{last.service}</p>}
          </div>
          <div>
            <p className="text-ink-300">Próxima cita</p>
            <p className="mt-0.5 font-medium text-ink-900">
              {next ? `${formatDateLong(next.date)} — ${next.time}` : 'Sin citas próximas'}
            </p>
            {next && <p className="text-xs text-ink-300">{next.service}</p>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-900">Historial de citas</p>
          {history.length === 0 ? (
            <p className="text-sm text-ink-300">Este paciente no tiene citas registradas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((appt) => (
                <li
                  key={appt.id}
                  className="flex items-center justify-between rounded-lg border border-mist-200 px-3.5 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink-900">{formatDateLong(appt.date)}</p>
                    <p className="text-xs text-ink-300">{appt.service}</p>
                  </div>
                  <Badge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
