import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import AppointmentModal from '../../components/dashboard/AppointmentModal.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { useAppState } from '../../context/AppContext.jsx'
import { getAgendaForDate, getAgendaForWeek } from '../../utils/appointmentLogic.js'
import {
  addDays,
  fromISODate,
  toISODate,
  isoOffset,
  isToday,
  formatDateLong,
  formatWeekdayShort,
  formatDayNumber
} from '../../utils/dateHelpers.js'

function startOfWeek(iso) {
  const d = fromISODate(iso)
  const day = d.getDay() // 0=domingo
  const diffToMonday = day === 0 ? -6 : 1 - day
  return toISODate(addDays(d, diffToMonday))
}

export default function AgendaPage() {
  const { appointments, patients } = useAppState()
  const [view, setView] = useState('day')
  const [selectedDate, setSelectedDate] = useState(isoOffset(0))
  const [selectedAppt, setSelectedAppt] = useState(null)

  function patientName(patientId) {
    return patients.find((p) => p.id === patientId)?.name || 'Paciente'
  }

  const dayAppointments = useMemo(
    () => getAgendaForDate(appointments, selectedDate),
    [appointments, selectedDate]
  )

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toISODate(addDays(fromISODate(weekStart), i))),
    [weekStart]
  )
  const weekAppointments = useMemo(
    () => getAgendaForWeek(appointments, weekStart, weekDays),
    [appointments, weekStart, weekDays]
  )

  function shiftDay(delta) {
    setSelectedDate((prev) => toISODate(addDays(fromISODate(prev), delta)))
  }

  function shiftWeek(delta) {
    setSelectedDate((prev) => toISODate(addDays(fromISODate(prev), delta * 7)))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Agenda</h1>
          <p className="mt-1 text-sm text-ink-500">Consulta y administra las citas de la clínica.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-ink-100 bg-white p-1">
          {['day', 'week'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                view === v ? 'bg-nuvia-500 text-white' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {v === 'day' ? 'Día' : 'Semana'}
            </button>
          ))}
        </div>
      </div>

      {view === 'day' && (
        <div className="mt-6">
          <div className="flex items-center justify-between rounded-xl2 border border-ink-100 bg-white px-4 py-3">
            <button
              onClick={() => shiftDay(-1)}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-mist-100"
              aria-label="Día anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-semibold text-ink-900">
              {formatDateLong(selectedDate)}
              {isToday(selectedDate) && <span className="ml-2 text-xs font-medium text-nuvia-600">Hoy</span>}
            </p>
            <button
              onClick={() => shiftDay(1)}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-mist-100"
              aria-label="Día siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {dayAppointments.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-ink-100 bg-white p-8 text-center text-sm text-ink-300">
                No hay citas este día.
              </div>
            ) : (
              dayAppointments.map((appt) => (
                <button
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className="flex items-center justify-between gap-4 rounded-xl2 border border-ink-100 bg-white px-4 py-3.5 text-left transition-colors hover:border-nuvia-300 hover:bg-nuvia-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-14 shrink-0 items-center justify-center gap-1 rounded-lg bg-mist-50 text-xs font-semibold text-ink-700">
                      <Clock size={12} />
                      {appt.time.replace(' ', '')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{patientName(appt.patientId)}</p>
                      <p className="text-xs text-ink-300">{appt.service}</p>
                    </div>
                  </div>
                  <Badge status={appt.status} />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="mt-6">
          <div className="flex items-center justify-between rounded-xl2 border border-ink-100 bg-white px-4 py-3">
            <button
              onClick={() => shiftWeek(-1)}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-mist-100"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-semibold text-ink-900">
              {formatDateLong(weekDays[0])} — {formatDateLong(weekDays[6])}
            </p>
            <button
              onClick={() => shiftWeek(1)}
              className="rounded-lg p-1.5 text-ink-500 hover:bg-mist-100"
              aria-label="Semana siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-7">
            {weekDays.map((iso) => {
              const dayAppts = weekAppointments.filter((a) => a.date === iso)
              return (
                <div key={iso} className="rounded-xl2 border border-ink-100 bg-white p-3">
                  <p
                    className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                      isToday(iso) ? 'text-nuvia-600' : 'text-ink-300'
                    }`}
                  >
                    {formatWeekdayShort(iso)} {formatDayNumber(iso)}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {dayAppts.length === 0 ? (
                      <p className="text-xs text-ink-300">—</p>
                    ) : (
                      dayAppts.map((appt) => (
                        <button
                          key={appt.id}
                          onClick={() => setSelectedAppt(appt)}
                          className="rounded-lg bg-mist-50 px-2 py-1.5 text-left text-xs transition-colors hover:bg-nuvia-50"
                        >
                          <p className="font-medium text-ink-900">{appt.time}</p>
                          <p className="truncate text-ink-500">{patientName(appt.patientId)}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AppointmentModal
        appointment={selectedAppt}
        patientName={selectedAppt ? patientName(selectedAppt.patientId) : ''}
        onClose={() => setSelectedAppt(null)}
      />
    </div>
  )
}
