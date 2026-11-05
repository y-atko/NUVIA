// Estado de la simulación de los servicios que todavía usan datos de ejemplo.
// Solo existe mientras el servicio correspondiente use el mock (ver config.js).
// Vive en memoria: se reinicia al recargar la página. Se ajusta desde Configuración (Diagnóstico).
import { ApiError } from '../client.js'

export const API_SCENARIOS = [
  { value: 'normal', label: 'Normal', description: 'Responde con los datos de ejemplo.' },
  { value: 'slow', label: 'Lenta', description: 'Tarda unos segundos en responder.' },
  { value: 'error', label: 'Con error', description: 'Toda consulta falla con un error 500.' },
  { value: 'offline', label: 'Sin conexión', description: 'Simula que el backend no responde (error de red).' },
  { value: 'empty', label: 'Sin resultados', description: 'No devuelve pacientes y los expedientes vienen vacíos.' }
]

export const AI_SCENARIOS = [
  { value: 'local', label: 'Generador local', description: 'Arma el reporte con una plantilla a partir del expediente. No es un modelo externo.' },
  { value: 'not_connected', label: 'Servicio no habilitado', description: 'La generación responde que aún no está habilitada (501).' },
  { value: 'unavailable', label: 'Servicio no disponible', description: 'La generación responde que no está disponible (503).' },
  { value: 'error', label: 'Error de generación', description: 'La generación falla con un error (500).' },
  { value: 'insufficient', label: 'Información insuficiente', description: 'La generación rechaza la solicitud por falta de información (422).' }
]

export const TRANSCRIPTION_SCENARIOS = [
  { value: 'not_connected', label: 'Servicio no habilitado', description: 'No hay transcripción automática: el texto se escribe a mano.' },
  { value: 'error', label: 'Error de transcripción', description: 'La transcripción falla con un error (500).' }
]

const DEFAULTS = { api: 'normal', ai: 'local', transcription: 'not_connected' }
const state = { ...DEFAULTS }
let latencyOverrideMs = null // las pruebas automáticas lo ponen en 0

export const getSimulation = () => ({ ...state })
export function setSimulation(key, value) {
  const list = { api: API_SCENARIOS, ai: AI_SCENARIOS, transcription: TRANSCRIPTION_SCENARIOS }[key]
  if (list && list.some((s) => s.value === value)) state[key] = value
}
export function resetSimulation() {
  Object.assign(state, DEFAULTS)
}
export function setMockLatency(ms) {
  latencyOverrideMs = ms
}

export function mockWait(signal, baseMs = 350) {
  const ms = latencyOverrideMs !== null ? latencyOverrideMs : state.api === 'slow' ? 2500 : baseMs
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(new ApiError('Solicitud cancelada', { kind: 'aborted' }))
      return
    }
    const timer = setTimeout(resolve, ms)
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(new ApiError('Solicitud cancelada', { kind: 'aborted' }))
        },
        { once: true }
      )
    }
  })
}

// Errores de "conexión con el backend" simulados: afectan a TODOS los servicios mock.
export function failIfBackendDown() {
  if (state.api === 'error') {
    throw new ApiError('Error simulado', { kind: 'http', status: 500, simulated: true })
  }
  if (state.api === 'offline') {
    throw new ApiError('Sin conexión (simulado)', { kind: 'network', simulated: true })
  }
}
