// Servicio de transcripción SIMULADO. No transcribe nada: nunca se lee el archivo ni se
// inventa texto. Por defecto responde que el servicio no está habilitado (501) y la interfaz
// ofrece escribir la transcripción a mano. Cuando exista el servicio real, este archivo deja de usarse.
import { ApiError } from '../client.js'
import { getSimulation, mockWait, failIfBackendDown } from './simulation.js'

export async function transcribe(patientId, file, { signal } = {}) {
  await mockWait(signal, 700)
  failIfBackendDown()
  const simulated = (status, code, message) => new ApiError(message, { kind: 'http', status, code, simulated: true })
  if (getSimulation().transcription === 'error') throw simulated(500, 'transcription_failed', 'Falló la transcripción')
  throw simulated(501, 'not_implemented', 'Servicio de transcripción no habilitado')
}
