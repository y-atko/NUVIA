// Envío de un audio al servicio de transcripción (a través del backend).
// Resultado: { status: 'ready', text, isSynthetic, ... } o { status: 'not_connected' }.
// NUNCA se fabrica texto: si el servicio no existe, no hay transcripción.
import { TRANSCRIPTION_SOURCE, GENERATION_TIMEOUT_MS } from './config.js'
import { apiRequest } from './client.js'
import { ENDPOINTS } from './endpoints.js'
import { normalizeTranscription } from './normalizeReport.js'
import * as mock from './mock/mockTranscription.js'

export async function transcribeAudio(patientId, file, { signal } = {}) {
  try {
    let raw
    if (TRANSCRIPTION_SOURCE === 'api') {
      const formData = new FormData()
      formData.append('patientId', patientId)
      formData.append('audio', file, file.name)
      raw = await apiRequest(ENDPOINTS.transcriptions(), { method: 'POST', formData, signal, timeoutMs: GENERATION_TIMEOUT_MS })
    } else {
      raw = await mock.transcribe(patientId, file, { signal })
    }
    return { status: 'ready', ...normalizeTranscription(raw) }
  } catch (err) {
    // 501 / 404 / 405: el servicio todavía no está implementado en el backend.
    if (err && err.kind === 'http' && [501, 404, 405].includes(err.status)) return { status: 'not_connected' }
    throw err
  }
}
