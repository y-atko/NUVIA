import React, { useState } from 'react'
import { Sparkles, Check, BellRing } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { formatDateLong } from '../../utils/dateHelpers.js'

function ReminderBubble({ children }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nuvia-500 to-sky-500 text-white">
        <Sparkles size={15} strokeWidth={2.25} />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-ink-100 bg-white px-4 py-3">{children}</div>
    </div>
  )
}

export default function RemindersPanel({ open, onClose, appointment, patientFirstName, onConfirm, onReprogramar, onCancelar }) {
  const [confirmed, setConfirmed] = useState(false)
  const [askingCancel, setAskingCancel] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  if (!appointment) {
    return (
      <Modal open={open} onClose={onClose} title="Recordatorios automáticos" subtitle="Ejemplo de mensajes por WhatsApp">
        <p className="text-sm text-ink-500">
          No hay una próxima cita activa para generar un recordatorio en este momento.
        </p>
      </Modal>
    )
  }

  const dateLabel = formatDateLong(appointment.date)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recordatorios automáticos"
      subtitle="Así se verán los mensajes que NUVIA enviará por WhatsApp"
      width="max-w-lg"
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300">
            <BellRing size={13} /> 48 horas antes
          </p>
          <ReminderBubble>
            <p className="text-sm leading-relaxed text-ink-900">
              Hola {patientFirstName} 👋{'\n'}
              Te recordamos que tienes una cita en Clínica Dental Sonrisa el {dateLabel} a las {appointment.time}.
              {'\n\n'}¿Confirmas tu asistencia?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {confirmed ? (
                <div className="flex items-center gap-1.5 text-sm font-medium text-nuvia-600">
                  <Check size={16} strokeWidth={2.5} /> Confirmada
                </div>
              ) : cancelled ? (
                <div className="flex items-center gap-1.5 text-sm font-medium text-coral-500">
                  <Check size={16} strokeWidth={2.5} /> Cita cancelada
                </div>
              ) : askingCancel ? (
                <div className="w-full">
                  <p className="mb-2 text-sm text-ink-700">¿Seguro que deseas cancelar esta cita?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="dangerSolid"
                      onClick={() => {
                        onCancelar(appointment.id)
                        setCancelled(true)
                        setAskingCancel(false)
                      }}
                    >
                      Sí, cancelar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setAskingCancel(false)}>
                      No, conservar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      onConfirm(appointment.id)
                      setConfirmed(true)
                    }}
                  >
                    Confirmar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={onReprogramar}>
                    Reprogramar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setAskingCancel(true)}>
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </ReminderBubble>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300">
            <BellRing size={13} /> 24 horas antes
          </p>
          <ReminderBubble>
            <p className="text-sm leading-relaxed text-ink-900">
              Hola {patientFirstName} 👋{'\n'}
              Te recordamos que mañana tienes tu cita en Clínica Dental Sonrisa a las {appointment.time}.
            </p>
          </ReminderBubble>
        </div>
      </div>
    </Modal>
  )
}
