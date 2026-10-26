import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles, CalendarPlus, CalendarClock, CalendarX, BellRing } from 'lucide-react'
import ChatMessageList from '../../components/chat/ChatMessageList.jsx'
import ChatComposer from '../../components/chat/ChatComposer.jsx'
import AppSwitcher from '../../components/ui/AppSwitcher.jsx'
import { useAppState, useAppActions, DEMO_PATIENT_ID } from '../../context/AppContext.jsx'
import { SERVICES, CLINIC } from '../../data/mockData.js'
import { getAvailableSlots, getNextAppointment } from '../../utils/appointmentLogic.js'
import { formatDateLong } from '../../utils/dateHelpers.js'

let seq = 1
const nextId = () => `m${seq++}`
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const MAIN_MENU_OPTIONS = [
  { value: 'agendar', label: 'Agendar cita', icon: CalendarPlus },
  { value: 'reprogramar', label: 'Reprogramar cita', icon: CalendarClock },
  { value: 'cancelar', label: 'Cancelar cita', icon: CalendarX },
  { value: 'recordatorios', label: 'Ver ejemplo de recordatorios', icon: BellRing }
]

export default function ChatPage() {
  const { appointments } = useAppState()
  const { createAppointment, rescheduleAppointment, cancelAppointment, confirmAppointment } = useAppActions()

  const [messages, setMessages] = useState(() => [
    {
      id: nextId(),
      kind: 'text',
      role: 'bot',
      text: 'Hola 👋 Soy Nuvia, la asistente virtual de Clínica Dental Sonrisa.\n\n¿En qué puedo ayudarte?'
    }
  ])
  const [isTyping, setIsTyping] = useState(false)

  // "step" tracks what kind of free-text input the composer should treat
  // specially, e.g. capturing the patient's name mid-flow.
  const [pendingTextStep, setPendingTextStep] = useState(null)

  // Keep the latest appointments/messages available inside stable callbacks
  // without re-creating them on every render.
  const appointmentsRef = useRef(appointments)
  appointmentsRef.current = appointments

  const pushMessage = useCallback((msg) => {
    const withId = { ...msg, id: msg.id || nextId() }
    setMessages((prev) => [...prev, withId])
    return withId.id
  }, [])

  const updateMessage = useCallback((id, patch) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const botSay = useCallback(
    async (msg, delay = 550) => {
      setIsTyping(true)
      await wait(delay)
      setIsTyping(false)
      return pushMessage({ role: 'bot', ...msg })
    },
    [pushMessage]
  )

  const showMainMenu = useCallback(
    async (introText = '¿Necesitas algo más?') => {
      const menuId = nextId()
      await botSay({
        id: menuId,
        kind: 'options',
        text: introText,
        options: MAIN_MENU_OPTIONS,
        selected: null,
        columns: 1,
        onSelect: (value) => handleMenuSelect(menuId, value)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [botSay]
  )

  function selectOption(messageId, value) {
    updateMessage(messageId, { selected: value })
  }

  // ---------- AGENDAR ----------

  const startAgendar = useCallback(
    async (menuId, fromMenuLabel) => {
      if (menuId) selectOption(menuId, 'agendar')
      pushMessage({ role: 'user', kind: 'text', text: fromMenuLabel || 'Agendar cita' })

      const serviceMsgId = nextId()
      await botSay({
        id: serviceMsgId,
        kind: 'options',
        text: 'Claro. ¿Qué servicio necesitas?',
        options: SERVICES.map((s) => ({ value: s, label: s })),
        selected: null,
        columns: 2,
        onSelect: (service) => onServiceChosen(serviceMsgId, service)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [botSay, pushMessage]
  )

  async function onServiceChosen(serviceMsgId, service) {
    selectOption(serviceMsgId, service)
    pushMessage({ role: 'user', kind: 'text', text: service })

    const dateMsgId = nextId()
    await botSay({
      id: dateMsgId,
      kind: 'dates',
      text: '¿Qué día te gustaría acudir?',
      selected: null,
      onSelect: (date) => onDateChosenForBooking(dateMsgId, service, date)
    })
  }

  async function onDateChosenForBooking(dateMsgId, service, date) {
    selectOption(dateMsgId, date)
    pushMessage({ role: 'user', kind: 'text', text: formatDateLong(date) })

    const slots = getAvailableSlots(appointmentsRef.current, date)
    const slotMsgId = nextId()
    await botSay({
      id: slotMsgId,
      kind: 'slots',
      text: 'Estos son los horarios disponibles:',
      slots,
      selected: null,
      onSelect: (time) => onSlotChosenForBooking(slotMsgId, service, date, time)
    })
  }

  async function onSlotChosenForBooking(slotMsgId, service, date, time) {
    selectOption(slotMsgId, time)
    pushMessage({ role: 'user', kind: 'text', text: time })

    await botSay({ kind: 'text', text: 'Perfecto. ¿Cuál es tu nombre?' })
    setPendingTextStep({ type: 'booking_name', service, date, time })
  }

  async function onNameProvidedForBooking(name, ctx) {
    pushMessage({ role: 'user', kind: 'text', text: name })

    const cardId = nextId()
    await botSay({
      id: cardId,
      kind: 'card',
      card: {
        title: 'Confirma tu cita',
        rows: [
          { label: 'Paciente', value: name },
          { label: 'Servicio', value: ctx.service },
          { label: 'Fecha', value: formatDateLong(ctx.date) },
          { label: 'Hora', value: ctx.time }
        ],
        actionLabel: 'Confirmar cita',
        actionDone: false,
        onAction: () => confirmBooking(cardId, name, ctx)
      }
    })
  }

  async function confirmBooking(cardId, name, ctx) {
    freezeCard(cardId)
    createAppointment({ patientName: name, service: ctx.service, date: ctx.date, time: ctx.time })

    await botSay({
      kind: 'text',
      text: '✅ Tu cita ha sido confirmada.\n\nTe enviaremos un recordatorio 48 horas y 24 horas antes de tu cita.'
    })
    await showMainMenu()
  }

  // ---------- REPROGRAMAR ----------

  const startReprogramar = useCallback(
    async (menuId, fromMenuLabel) => {
      if (menuId) selectOption(menuId, 'reprogramar')
      pushMessage({ role: 'user', kind: 'text', text: fromMenuLabel || 'Reprogramar cita' })

      const next = getNextAppointment(appointmentsRef.current, DEMO_PATIENT_ID)
      if (!next) {
        await botSay({ kind: 'text', text: 'No encontré ninguna cita próxima a tu nombre.' })
        await showMainMenu()
        return
      }

      const cardId = nextId()
      await botSay({
        id: cardId,
        kind: 'card',
        text: 'Tu próxima cita',
        card: {
          title: 'Tu próxima cita',
          status: next.status,
          rows: [
            { label: 'Fecha', value: formatDateLong(next.date) },
            { label: 'Hora', value: next.time },
            { label: 'Servicio', value: next.service }
          ],
          actionLabel: 'Reprogramar',
          actionDone: false,
          onAction: () => beginRescheduleDatePicker(cardId, next)
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [botSay, pushMessage]
  )

  function freezeCard(cardId) {
    setMessages((prev) =>
      prev.map((m) => (m.id === cardId ? { ...m, card: { ...m.card, actionDone: true } } : m))
    )
  }

  async function beginRescheduleDatePicker(cardId, appt) {
    freezeCard(cardId)
    await botSay({ kind: 'text', text: '¿Qué día quieres cambiar tu cita?' })

    const dateMsgId = nextId()
    await botSay({
      id: dateMsgId,
      kind: 'dates',
      selected: null,
      onSelect: (date) => onDateChosenForReschedule(dateMsgId, appt, date)
    })
  }

  async function onDateChosenForReschedule(dateMsgId, appt, date) {
    selectOption(dateMsgId, date)
    pushMessage({ role: 'user', kind: 'text', text: formatDateLong(date) })

    const slots = getAvailableSlots(appointmentsRef.current, date, appt.id)
    const slotMsgId = nextId()
    await botSay({
      id: slotMsgId,
      kind: 'slots',
      text: 'Horarios disponibles:',
      slots,
      selected: null,
      onSelect: (time) => onSlotChosenForReschedule(slotMsgId, appt, date, time)
    })
  }

  async function onSlotChosenForReschedule(slotMsgId, appt, date, time) {
    selectOption(slotMsgId, time)
    pushMessage({ role: 'user', kind: 'text', text: time })

    rescheduleAppointment({ appointmentId: appt.id, date, time })

    await botSay({ kind: 'text', text: 'Tu cita ha sido reprogramada correctamente.' })
    await botSay({
      kind: 'card',
      card: {
        title: 'Cita actualizada',
        status: 'confirmada',
        rows: [
          { label: 'Fecha', value: formatDateLong(date) },
          { label: 'Hora', value: time },
          { label: 'Servicio', value: appt.service }
        ]
      }
    })
    await showMainMenu()
  }

  // ---------- CANCELAR ----------

  const startCancelar = useCallback(
    async (menuId, fromMenuLabel) => {
      if (menuId) selectOption(menuId, 'cancelar')
      pushMessage({ role: 'user', kind: 'text', text: fromMenuLabel || 'Cancelar cita' })

      const next = getNextAppointment(appointmentsRef.current, DEMO_PATIENT_ID)
      if (!next) {
        await botSay({ kind: 'text', text: 'No encontré ninguna cita próxima a tu nombre.' })
        await showMainMenu()
        return
      }

      const cardId = nextId()
      await botSay({
        id: cardId,
        kind: 'card',
        card: {
          title: `${formatDateLong(next.date)} — ${next.time}`,
          status: next.status,
          rows: [{ label: 'Servicio', value: next.service }],
          actionLabel: 'Cancelar cita',
          actionVariant: 'danger',
          actionDone: false,
          onAction: () => confirmCancelPrompt(cardId, next)
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [botSay, pushMessage]
  )

  async function confirmCancelPrompt(cardId, appt) {
    freezeCard(cardId)

    const promptId = nextId()
    await botSay({
      id: promptId,
      kind: 'options',
      text: '¿Estás seguro de que deseas cancelar esta cita?',
      options: [
        { value: 'si', label: 'Sí, cancelar' },
        { value: 'no', label: 'No, conservar cita' }
      ],
      selected: null,
      columns: 1,
      onSelect: (value) => resolveCancelPrompt(promptId, appt, value)
    })
  }

  async function resolveCancelPrompt(promptId, appt, value) {
    selectOption(promptId, value)
    pushMessage({ role: 'user', kind: 'text', text: value === 'si' ? 'Sí, cancelar' : 'No, conservar cita' })

    if (value === 'si') {
      cancelAppointment(appt.id)
      await botSay({ kind: 'text', text: 'Tu cita ha sido cancelada correctamente.' })
    } else {
      await botSay({ kind: 'text', text: 'De acuerdo, tu cita se mantiene sin cambios.' })
    }
    await showMainMenu()
  }

  // ---------- RECORDATORIOS (demo) ----------

  const startRecordatorios = useCallback(
    async (menuId) => {
      if (menuId) selectOption(menuId, 'recordatorios')
      pushMessage({ role: 'user', kind: 'text', text: 'Ver ejemplo de recordatorios' })

      const next = getNextAppointment(appointmentsRef.current, DEMO_PATIENT_ID)
      const dateLabel = next ? formatDateLong(next.date) : '20 de septiembre'
      const timeLabel = next ? next.time : '04:00 PM'

      await botSay({
        kind: 'text',
        text: 'Así es como se ven los recordatorios automáticos que recibirás por WhatsApp antes de tu cita 👇'
      })

      const reminder48Id = nextId()
      await botSay({
        id: reminder48Id,
        kind: 'options',
        text: `Hola Juan 👋\n\nTe recordamos que tienes una cita en ${CLINIC.name} el ${dateLabel} a las ${timeLabel}.\n\n¿Confirmas tu asistencia?`,
        options: [
          { value: 'confirmar', label: 'Confirmar' },
          { value: 'reprogramar', label: 'Reprogramar' },
          { value: 'cancelar', label: 'Cancelar' }
        ],
        selected: null,
        columns: 1,
        onSelect: (value) => onReminderAction(reminder48Id, next, value)
      }, 700)

      await botSay({
        kind: 'text',
        text: `Recordatorio de 24 horas:\n\nHola Juan 👋\n\nTe recordamos que mañana tienes tu cita en ${CLINIC.name} a las ${timeLabel}.`
      })

      await showMainMenu('¿Quieres probar algo más?')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [botSay, pushMessage]
  )

  async function onReminderAction(reminderId, appt, value) {
    selectOption(reminderId, value)
    pushMessage({ role: 'user', kind: 'text', text: { confirmar: 'Confirmar', reprogramar: 'Reprogramar', cancelar: 'Cancelar' }[value] })

    if (value === 'confirmar') {
      if (appt) confirmAppointment(appt.id)
      await botSay({ kind: 'text', text: '✅ ¡Gracias! Tu asistencia ha sido confirmada.' })
      await showMainMenu()
    } else if (value === 'reprogramar') {
      await startReprogramar(null, null)
    } else {
      await startCancelar(null, null)
    }
  }

  // ---------- Menú principal ----------

  async function handleMenuSelect(menuId, value) {
    if (value === 'agendar') return startAgendar(menuId, 'Agendar cita')
    if (value === 'reprogramar') return startReprogramar(menuId, 'Reprogramar cita')
    if (value === 'cancelar') return startCancelar(menuId, 'Cancelar cita')
    if (value === 'recordatorios') return startRecordatorios(menuId)
  }

  // Kick off the very first menu once, right after the greeting.
  const menuShown = useRef(false)
  useEffect(() => {
    if (menuShown.current) return
    menuShown.current = true
    const menuId = nextId()
    const timer = setTimeout(() => {
      pushMessage({
        id: menuId,
        role: 'bot',
        kind: 'options',
        options: MAIN_MENU_OPTIONS,
        selected: null,
        columns: 1,
        onSelect: (value) => handleMenuSelect(menuId, value)
      })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Composer (free text) ----------

  async function handleComposerSubmit(text) {
    if (pendingTextStep?.type === 'booking_name') {
      const ctx = pendingTextStep
      setPendingTextStep(null)
      await onNameProvidedForBooking(text, ctx)
      return
    }

    pushMessage({ role: 'user', kind: 'text', text })

    const lower = text.toLowerCase()
    if (lower.includes('agendar')) return startAgendar(null, null)
    if (lower.includes('reprogramar')) return startReprogramar(null, null)
    if (lower.includes('cancelar')) return startCancelar(null, null)
    if (lower.includes('recordatorio')) return startRecordatorios(null)

    await botSay({
      kind: 'text',
      text: 'Puedo ayudarte a agendar, reprogramar o cancelar tu cita, o mostrarte cómo funcionan los recordatorios. ¿Qué te gustaría hacer?'
    })
    await showMainMenu('Elige una opción:')
  }

  return (
    <div className="flex h-screen flex-col bg-mist-50 pb-20">
      <header className="flex items-center gap-3 border-b border-mist-200 bg-white/90 px-4 py-3.5 backdrop-blur sm:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-nuvia-500 to-sky-500 text-white shadow-sm">
          <Sparkles size={18} strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight text-ink-900">NUVIA</h1>
          <p className="text-xs leading-tight text-ink-300">Asistente virtual de {CLINIC.name}</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ChatMessageList messages={messages} isTyping={isTyping} />
        </div>
        <ChatComposer
          placeholder={
            pendingTextStep?.type === 'booking_name' ? 'Escribe tu nombre…' : 'Escribe un mensaje…'
          }
          onSubmit={handleComposerSubmit}
        />
      </div>

      <AppSwitcher />
    </div>
  )
}
