// Las fechas del expediente llegan como TEXTO y pueden venir en formatos distintos
// o inválidos (así lo indica el diccionario de datos). Regla de esta interfaz:
// solo se reformatea lo que se reconoce con seguridad (YYYY-MM-DD válido);
// cualquier otro valor se muestra exactamente como llegó. Nunca se inventa una fecha.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatDisplayDate(value) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  if (text === '') return null

  const match = ISO_DATE.exec(text)
  if (match) {
    const [, year, month, day] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    const valid =
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    if (valid) return `${day}/${month}/${year}`
  }
  return text
}

// Marcas de tiempo generadas por el SISTEMA (creación o confirmación de un reporte), no
// fechas clínicas: aquí sí se pueden interpretar y mostrar en la hora local.
// Si el valor no es una fecha válida, se muestra tal como llegó.
export function formatDateTime(value) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  if (text === '') return null
  const date = new Date(text)
  if (Number.isNaN(date.getTime()) || !/^\d{4}-\d{2}-\d{2}T/.test(text)) return text
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
