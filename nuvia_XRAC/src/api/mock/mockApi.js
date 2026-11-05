// API simulada de pacientes y expedientes. Devuelve el MISMO formato que el backend real
// (JSON crudo), de modo que la normalización y las pantallas se ejercitan igual con datos
// de prueba que con la API. Los escenarios (simulation.js) permiten ver los estados de carga
// lenta, error, sin conexión y vacío desde Configuración.
import { MOCK_PATIENTS, MOCK_RECORDS } from './mockData.js'
import { ApiError } from '../client.js'
import {
  API_SCENARIOS,
  getSimulation,
  setSimulation,
  setMockLatency,
  mockWait,
  failIfBackendDown
} from './simulation.js'

export const SCENARIOS = API_SCENARIOS
export const getScenario = () => getSimulation().api
export const setScenario = (value) => setSimulation('api', value)
export { setMockLatency }

const clone = (value) => JSON.parse(JSON.stringify(value))

export async function listPatients({ q = '', limit = 50, signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  if (getScenario() === 'empty') return { items: [], total: 0 }

  const needle = q.trim().toLowerCase()
  const matches = MOCK_PATIENTS.filter(
    (p) => !needle || p.label.toLowerCase().includes(needle) || p.id.toLowerCase().includes(needle)
  )
  return { items: clone(matches.slice(0, limit)), total: matches.length }
}

export async function getPatientRecord(patientId, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()

  const record = MOCK_RECORDS[patientId]
  if (!record) throw new ApiError('Paciente no encontrado', { kind: 'http', status: 404 })

  if (getScenario() === 'empty') {
    return {
      meta: { ...clone(record.meta), notes: 'Escenario «Sin resultados»: el expediente llegó vacío.' },
      patient: clone(record.patient),
      summary: { sections: [] },
      alerts: [],
      sources: [],
      records: []
    }
  }
  return clone(record)
}
