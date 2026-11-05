// Punto único de acceso a datos para las pantallas.
// Según DATA_SOURCE usa el backend real (client.js) o los datos de prueba (mock/).
// Las pantallas nunca importan el mock ni hacen fetch directamente.
import { DATA_SOURCE } from './config.js'
import { apiGet, ApiError } from './client.js'
import { ENDPOINTS } from './endpoints.js'
import { normalizeListResponse, normalizeRecord } from './normalize.js'
import * as mockApi from './mock/mockApi.js'

export async function listPatients({ q = '', limit = 50, signal } = {}) {
  const raw =
    DATA_SOURCE === 'api'
      ? await apiGet(ENDPOINTS.patients(), { params: { q, limit }, signal })
      : await mockApi.listPatients({ q, limit, signal })
  return normalizeListResponse(raw)
}

export async function getPatientRecord(patientId, { signal } = {}) {
  const raw =
    DATA_SOURCE === 'api'
      ? await apiGet(ENDPOINTS.patientRecord(patientId), { signal })
      : await mockApi.getPatientRecord(patientId, { signal })
  // Seguridad: si el backend identifica al paciente y no coincide con el solicitado, no se muestra.
  const returnedId = raw && raw.patient && raw.patient.id
  if (returnedId !== undefined && returnedId !== null && String(returnedId) !== String(patientId)) {
    throw new ApiError('El expediente no corresponde al paciente seleccionado', { kind: 'mismatch' })
  }
  return normalizeRecord(raw, patientId)
}

// Para el botón "Probar conexión" de Configuración.
export async function checkConnection() {
  const start = Date.now()
  await listPatients({ limit: 1 })
  return { ok: true, ms: Date.now() - start, source: DATA_SOURCE }
}
