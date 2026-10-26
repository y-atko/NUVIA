// Small, dependency-free date helpers for the NUVIA prototype.
// Dates are stored internally as ISO strings ("YYYY-MM-DD") and times as
// display strings like "09:00 AM" so mock data reads naturally in the UI.

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const WEEKDAYS_ES = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
]

export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Convenience: ISO date string for "today + n days"
export function isoOffset(n) {
  return toISODate(addDays(startOfToday(), n))
}

export function formatDateLong(iso) {
  const d = fromISODate(iso)
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateShort(iso) {
  const d = fromISODate(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function formatWeekdayShort(iso) {
  const d = fromISODate(iso)
  const label = WEEKDAYS_ES[d.getDay()]
  return label.charAt(0).toUpperCase() + label.slice(1, 3)
}

export function formatDayNumber(iso) {
  return fromISODate(iso).getDate()
}

export function isToday(iso) {
  return iso === toISODate(startOfToday())
}

export function isPastDate(iso) {
  return fromISODate(iso) < startOfToday()
}

export function isFutureDate(iso) {
  return fromISODate(iso) > startOfToday()
}

// Parses "04:00 PM" into minutes-since-midnight for sorting/comparison.
export function timeToMinutes(timeStr) {
  const [time, period] = timeStr.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h * 60 + m
}

export function sortByDateTime(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return timeToMinutes(a.time) - timeToMinutes(b.time)
}

export function relativeDayLabel(iso) {
  if (isToday(iso)) return 'Hoy'
  const tomorrow = isoOffset(1)
  if (iso === tomorrow) return 'Mañana'
  return `${formatWeekdayShort(iso)} ${formatDayNumber(iso)}`
}

export const ALL_TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM'
]
