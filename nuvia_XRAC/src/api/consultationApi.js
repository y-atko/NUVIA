// Envío de la información adicional que el profesional aporta en la consulta
// (texto escrito y/o transcripción ya revisada). El backend la registra y devuelve ids,
// que luego se citan como fuentes en el reporte.
import { REPORTS_SOURCE } from './config.js'
import { apiRequest, ApiError } from './client.js'
import { ENDPOINTS } from './endpoints.js'
import { normalizeSubmittedInputs } from './normalizeReport.js'
import * as mock from './mock/mockReports.js'

// inputs: [{ kind: 'input' | 'transcription', label, text }]
export async function submitConsultationInputs(patientId, inputs, { signal } = {}) {
  if (inputs.length === 0) return []
  const raw =
    REPORTS_SOURCE === 'api'
      ? await apiRequest(ENDPOINTS.consultationInputs(patientId), { method: 'POST', body: { inputs }, signal })
      : await mock.submitInputs(patientId, inputs, { signal })
  const submitted = normalizeSubmittedInputs(raw)
  if (submitted.length !== inputs.length) {
    throw new ApiError('El servidor no registró toda la información enviada', { kind: 'parse' })
  }
  return submitted
}
