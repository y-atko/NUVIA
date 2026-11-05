// Configuración del frontend. Orden de prioridad:
//   1) window.__NUVIA_CONFIG__  -> public/config.js (se edita sin recompilar; ideal para Docker)
//   2) variables de Vite VITE_*  -> se fijan AL COMPILAR (y en `npm run dev`)
//   3) valores por defecto
// Nada de lo que se lee aquí es secreto: el navegador puede ver todos estos valores.

const runtime = (typeof window !== 'undefined' && window.__NUVIA_CONFIG__) || {}
const env = (import.meta && import.meta.env) || {}

function read(key, fallback) {
  for (const value of [runtime[key], env[`VITE_${key}`]]) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return fallback
}

// Versión provisional de los formatos JSON acordados con backend (ver docs/).
export const CONTRACT_VERSION = '0.3-provisional'

// 'mock' mientras no exista backend; cambiar a 'api' cuando haya endpoint real.
export const DATA_SOURCE = read('DATA_SOURCE', 'mock') === 'api' ? 'api' : 'mock'

// Cada servicio puede conectarse por separado (el backend de pacientes puede estar listo
// antes que el de reportes o el de transcripción). Si no se indica, siguen a DATA_SOURCE.
const sourceFor = (key) => (read(key, DATA_SOURCE) === 'api' ? 'api' : 'mock')
export const REPORTS_SOURCE = sourceFor('REPORTS_SOURCE')
export const TRANSCRIPTION_SOURCE = sourceFor('TRANSCRIPTION_SOURCE')

// Dirección del backend VISTA DESDE EL NAVEGADOR (no la dirección interna entre contenedores).
export const API_BASE_URL = read('API_BASE_URL', '/api').replace(/\/+$/, '')

const positive = (value, fallback) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}
export const REQUEST_TIMEOUT_MS = positive(read('REQUEST_TIMEOUT_MS', '15000'), 15000)
// La IA y la transcripción tardan más que una consulta normal.
export const GENERATION_TIMEOUT_MS = positive(read('GENERATION_TIMEOUT_MS', '120000'), 120000)
// Tamaño máximo de audio aceptado por la interfaz (el backend puede imponer otro límite).
export const MAX_AUDIO_MB = positive(read('MAX_AUDIO_MB', '25'), 25)
