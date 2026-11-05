// Persistencia LOCAL de los datos de ejemplo (borradores, reportes, versiones e información
// adicional), para que sobrevivan a una recarga mientras no haya backend conectado.
//
// Solo la usa el servicio simulado de reportes (REPORTS_SOURCE='mock'). Con el backend real
// (REPORTS_SOURCE='api') este módulo no se ejecuta y NO se guarda nada clínico en el navegador.
// Para sustituirla no hay que tocar el editor: basta con conectar el servicio real (config.js),
// o con pasar otra implementación de `createPersistence` (misma forma: load / save / clear).

export const STORAGE_KEY = 'nuvia.sampleData'
// Súbelo cuando cambie la forma de los datos guardados: se descartan los antiguos y se resiembra.
export const SCHEMA = 3

const defaultStorage = () => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null // p. ej. almacenamiento bloqueado por el navegador
  }
}

export function createPersistence(getStorage = defaultStorage) {
  return {
    load() {
      try {
        const storage = getStorage()
        const raw = storage && storage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed && parsed.schema === SCHEMA && parsed.state ? parsed.state : null
      } catch {
        return null // dato corrupto: se ignora y se resiembra
      }
    },
    save(state) {
      try {
        const storage = getStorage()
        if (storage) storage.setItem(STORAGE_KEY, JSON.stringify({ schema: SCHEMA, state }))
      } catch {
        // Sin almacenamiento o sin espacio: la aplicación sigue funcionando en memoria.
      }
    },
    clear() {
      try {
        const storage = getStorage()
        if (storage) storage.removeItem(STORAGE_KEY)
      } catch {
        // nada que limpiar
      }
    }
  }
}
