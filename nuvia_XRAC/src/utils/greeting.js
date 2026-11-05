// Saludo según la hora local y fecha larga en español.
export function greetingFor(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function longDate(date = new Date()) {
  const text = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Iniciales para el avatar: primera letra de las dos primeras palabras ("Ana Lucía Treviño" -> "AL").
export function initialsOf(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}
