import React, { useMemo, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import DateChips from '../chat/DateChips.jsx'
import TimeSlotGrid from '../chat/TimeSlotGrid.jsx'
import { useAppState, useAppActions } from '../../context/AppContext.jsx'
import { getAvailableSlots } from '../../utils/appointmentLogic.js'
import { formatDateLong } from '../../utils/dateHelpers.js'
import { Check, X } from 'lucide-react'

export default function AppointmentModal({ appointment, patientName, onClose }) {
  const { appointments } = useAppState()
  const { confirmAppointment, cancelAppointment, rescheduleAppointment } = useAppActions()
  const [mode, setMode] = useState('details') // 'details' | 'reschedule' | 'cancel-confirm'
  const [newDate, setNewDate] = useState(null)

  const slots = useMemo(
    () => (newDate ? getAvailableSlots(appointments, newDate, appointment?.id) : []),
    [appointments, newDate, appointment]
  )

  if (!appointment) return null

  function handleReschedule(time) {
    rescheduleAppointment({ appointmentId: appointment.id, date: newDate, time })
    onClose()
  }

  function handleCancel() {
    cancelAppointment(appointment.id)
    onClose()
  }

  function handleConfirm() {
    confirmAppointment(appointment.id)
    onClose()
  }

  return (
    <Modal
      open={Boolean(appointment)}
      onClose={onClose}
      title={mode === 'reschedule' ? 'Reprogramar cita' : mode === 'cancel-confirm' ? 'Cancelar cita' : 'Detalle de la cita'}
      subtitle={mode === 'details' ? patientName : undefined}
    >
      {mode === 'details' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-ink-900">{patientName}</h4>
            <Badge status={appointment.status} />
          </div>
          <dl className="grid grid-cols-2 gap-4 rounded-xl bg-mist-50 p-4 text-sm">
            <div>
              <dt className="text-ink-300">Servicio</dt>
              <dd className="mt-0.5 font-medium text-ink-900">{appointment.service}</dd>
            </div>
            <div>
              <dt className="text-ink-300">Fecha</dt>
              <dd className="mt-0.5 font-medium text-ink-900">{formatDateLong(appointment.date)}</dd>
            </div>
            <div>
              <dt className="text-ink-300">Hora</dt>
              <dd className="mt-0.5 font-medium text-ink-900">{appointment.time}</dd>
            </div>
            <div>
              <dt className="text-ink-300">Estado</dt>
              <dd className="mt-0.5">
                <Badge status={appointment.status} />
              </dd>
            </div>
          </dl>

          {appointment.status !== 'cancelada' && appointment.status !== 'completada' && (
            <div className="flex flex-wrap gap-2">
              {appointment.status === 'pendiente' && (
                <Button variant="primary" size="sm" icon={Check} onClick={handleConfirm}>
                  Confirmar
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setMode('reschedule')}>
                Reprogramar
              </Button>
              <Button variant="danger" size="sm" icon={X} onClick={() => setMode('cancel-confirm')}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === 'reschedule' && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">Elige la nueva fecha</p>
            <DateChips selected={newDate} onSelect={setNewDate} />
          </div>
          {newDate && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink-700">Elige el nuevo horario</p>
              <TimeSlotGrid slots={slots} selected={null} onSelect={handleReschedule} />
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setMode('details')} className="self-start">
            Volver
          </Button>
        </div>
      )}

      {mode === 'cancel-confirm' && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-700">
            ¿Estás seguro de que deseas cancelar la cita de <strong>{patientName}</strong> el{' '}
            {formatDateLong(appointment.date)} a las {appointment.time}?
          </p>
          <div className="flex gap-2">
            <Button variant="dangerSolid" size="sm" onClick={handleCancel}>
              Sí, cancelar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setMode('details')}>
              No, conservar cita
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
