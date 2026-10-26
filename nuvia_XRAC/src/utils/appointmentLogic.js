import { ALL_TIME_SLOTS, isPastDate, isToday, sortByDateTime, toISODate, startOfToday } from './dateHelpers.js'

export const STATUS_META = {
  confirmada: { label: 'Confirmada', dot: 'bg-nuvia-500', text: 'text-nuvia-700', bg: 'bg-nuvia-50' },
  pendiente: { label: 'Pendiente', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  completada: { label: 'Completada', dot: 'bg-ink-300', text: 'text-ink-500', bg: 'bg-mist-100' },
  cancelada: { label: 'Cancelada', dot: 'bg-coral-500', text: 'text-coral-500', bg: 'bg-red-50' }
}

// A cancelled appointment never counts as anyone's "next" appointment.
const ACTIVE_STATUSES = ['confirmada', 'pendiente', 'completada']

export function getPatientAppointments(appointments, patientId) {
  return appointments.filter((a) => a.patientId === patientId)
}

// "Próxima cita": earliest upcoming (today or future) appointment that
// hasn't been cancelled.
export function getNextAppointment(appointments, patientId) {
  const upcoming = appointments
    .filter((a) => a.patientId === patientId && a.status !== 'cancelada' && !isPastDate(a.date))
    .sort(sortByDateTime)
  return upcoming[0] || null
}

// "Última cita": most recent past appointment (cancelled ones don't count
// as a visit that happened).
export function getLastAppointment(appointments, patientId) {
  const past = appointments
    .filter((a) => a.patientId === patientId && a.status !== 'cancelada' && isPastDate(a.date))
    .sort(sortByDateTime)
  return past[past.length - 1] || null
}

export function getPatientHistory(appointments, patientId) {
  return getPatientAppointments(appointments, patientId).sort(sortByDateTime)
}

// Slots already taken on a given date (excluding a specific appointment id,
// useful when rescheduling that same appointment).
export function getAvailableSlots(appointments, date, excludeAppointmentId) {
  const taken = new Set(
    appointments
      .filter((a) => a.date === date && a.status !== 'cancelada' && a.id !== excludeAppointmentId)
      .map((a) => a.time)
  )
  return ALL_TIME_SLOTS.filter((slot) => !taken.has(slot))
}

export function getDashboardStats(appointments) {
  const citasHoy = appointments.filter((a) => isToday(a.date) && a.status !== 'cancelada').length
  const proximasCitas = appointments.filter(
    (a) => a.status !== 'cancelada' && !isPastDate(a.date) && !isToday(a.date)
  ).length
  const pendientes = appointments.filter((a) => a.status === 'pendiente').length
  return { citasHoy, proximasCitas, pendientes }
}

export function getTodayAgenda(appointments) {
  return appointments.filter((a) => isToday(a.date)).sort(sortByDateTime)
}

export function getAgendaForDate(appointments, date) {
  return appointments.filter((a) => a.date === date).sort(sortByDateTime)
}

export function getAgendaForWeek(appointments, mondayISO, days) {
  const set = new Set(days)
  return appointments.filter((a) => set.has(a.date)).sort(sortByDateTime)
}
