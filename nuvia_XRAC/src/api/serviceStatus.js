// Cómo obtiene datos cada servicio. Solo lo usa Configuración (sección "Conexiones").
import { DATA_SOURCE, REPORTS_SOURCE, TRANSCRIPTION_SOURCE } from './config.js'
import { getSimulation, AI_SCENARIOS, TRANSCRIPTION_SCENARIOS } from './mock/simulation.js'

const labelOf = (list, value) => (list.find((s) => s.value === value) || {}).label

export function getServiceStatuses() {
  const sim = getSimulation()
  return [
    {
      key: 'patients',
      label: 'Pacientes y expedientes',
      mode: DATA_SOURCE,
      detail: DATA_SOURCE === 'mock' ? 'Datos de ejemplo' : 'API configurada'
    },
    {
      key: 'reports',
      label: 'Reportes',
      mode: REPORTS_SOURCE,
      detail:
        REPORTS_SOURCE === 'api'
          ? 'API configurada'
          : sim.ai === 'local'
            ? 'Datos de ejemplo con generador local'
            : `Simulación: ${labelOf(AI_SCENARIOS, sim.ai)}`
    },
    {
      key: 'transcription',
      label: 'Transcripción de audio',
      mode: TRANSCRIPTION_SOURCE,
      detail:
        TRANSCRIPTION_SOURCE === 'api'
          ? 'API configurada'
          : sim.transcription === 'not_connected'
            ? 'Sin transcripción automática (texto manual)'
            : `Simulación: ${labelOf(TRANSCRIPTION_SCENARIOS, sim.transcription)}`
    }
  ]
}
