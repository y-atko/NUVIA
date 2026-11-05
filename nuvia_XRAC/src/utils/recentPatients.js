// Pacientes abiertos recientemente, guardados SOLO durante esta sesión del navegador (sessionStorage; se borran al cerrar la pestaña).
// Se guarda únicamente el identificador y la etiqueta para mostrar. Si el equipo se comparte,
// el botón "Borrar historial" del panel principal limpia esta lista.
const KEY = 'nuvia.recentPatients'
const MAX = 5

export function getRecentPatients() {
  try {
    const list = JSON.parse(sessionStorage.getItem(KEY) || '[]')
    return Array.isArray(list)
      ? list
          .filter((p) => p && typeof p.id === 'string' && typeof p.label === 'string')
          .slice(0, MAX)
      : []
  } catch {
    return []
  }
}

export function rememberPatient({ id, label }) {
  if (!id) return
  try {
    const rest = getRecentPatients().filter((p) => p.id !== id)
    sessionStorage.setItem(KEY, JSON.stringify([{ id, label: label || id }, ...rest].slice(0, MAX)))
  } catch {
    // Sin almacenamiento disponible: la función simplemente no guarda nada.
  }
}

export function clearRecentPatients() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // nada que limpiar
  }
}
