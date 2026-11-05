// Cliente HTTP mínimo. Todas las llamadas al backend pasan por aquí.
// Convierte los fallos (red, tiempo agotado, HTTP, JSON inválido) en un ApiError
// con un "kind" estable para que la interfaz pueda mostrar un mensaje claro.
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config.js'

export class ApiError extends Error {
  constructor(message, { kind = 'unknown', status = null, code = null, cause, simulated = false } = {}) {
    super(message)
    this.name = 'ApiError'
    // 'network' | 'timeout' | 'http' | 'parse' | 'aborted' | 'mismatch' | 'unknown'
    this.kind = kind
    this.status = status
    // Código de negocio opcional que envía el backend en { "error": { "code": "..." } }
    this.code = code
    this.cause = cause
    this.simulated = simulated
  }
}

export function buildUrl(baseUrl, path, params) {
  const query = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  })
  const qs = query.toString()
  return `${baseUrl}${path}${qs ? `?${qs}` : ''}`
}

// Si el backend responde con un error, intenta leer { error: { code, message } } (opcional).
async function readErrorBody(response) {
  try {
    if (typeof response.json !== 'function') return {}
    const body = await response.json()
    const error = body && typeof body === 'object' ? body.error : null
    return {
      code: error && typeof error.code === 'string' ? error.code : null,
      message: error && typeof error.message === 'string' ? error.message : null
    }
  } catch {
    return {}
  }
}

// body: objeto (se envía como JSON) | formData: FormData (multipart; no fijar Content-Type)
export async function apiRequest(
  path,
  { method = 'GET', body, formData, params, signal, baseUrl = API_BASE_URL, timeoutMs = REQUEST_TIMEOUT_MS, fetchImpl } = {}
) {
  const doFetch = fetchImpl || ((...args) => fetch(...args))
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const forwardAbort = () => controller.abort()

  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', forwardAbort, { once: true })
  }

  const headers = { Accept: 'application/json' }
  let payload
  if (formData) {
    payload = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  try {
    let response
    try {
      response = await doFetch(buildUrl(baseUrl, path, params), {
        method,
        headers,
        body: payload,
        signal: controller.signal
      })
    } catch (err) {
      if (timedOut) throw new ApiError('Tiempo de espera agotado', { kind: 'timeout', cause: err })
      if ((signal && signal.aborted) || (err && err.name === 'AbortError')) {
        throw new ApiError('Solicitud cancelada', { kind: 'aborted', cause: err })
      }
      throw new ApiError('No se pudo conectar con el servidor', { kind: 'network', cause: err })
    }

    if (!response.ok) {
      const detail = await readErrorBody(response)
      throw new ApiError(detail.message || `El servidor respondió ${response.status}`, {
        kind: 'http',
        status: response.status,
        code: detail.code
      })
    }

    try {
      return await response.json()
    } catch (err) {
      throw new ApiError('La respuesta no es JSON válido', {
        kind: 'parse',
        status: response.status,
        cause: err
      })
    }
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', forwardAbort)
  }
}

export const apiGet = (path, options = {}) => apiRequest(path, { ...options, method: 'GET' })

// Texto para mostrar al usuario según el tipo de error.
export function describeError(err, baseUrl = API_BASE_URL) {
  if (err && err.simulated) {
    return {
      title: err.kind === 'network' ? 'Sin conexión con el backend (simulado)' : 'Error simulado',
      detail: 'Este error se activó desde Configuración para probar cómo se ve este estado.'
    }
  }
  switch (err && err.kind) {
    case 'network':
      return {
        title: 'No se pudo conectar con el servidor',
        detail: `Verifica que el backend esté en ejecución y que la dirección configurada sea correcta (${baseUrl}).`
      }
    case 'timeout':
      return {
        title: 'El servidor tardó demasiado en responder',
        detail: 'Intenta de nuevo. Si se repite, avisa al equipo de backend.'
      }
    case 'parse':
      return {
        title: 'La respuesta no tiene el formato esperado',
        detail: 'El servidor respondió, pero el contenido no es JSON válido. Revisa el contrato de la API.'
      }
    case 'mismatch':
      return {
        title: 'La respuesta no corresponde al paciente seleccionado',
        detail: 'Por seguridad no se muestra. Avisa al equipo de backend.'
      }
    case 'http':
      if (err.status === 401) {
        return { title: 'Sesión no válida o expirada', detail: 'Vuelve a iniciar sesión e inténtalo de nuevo.' }
      }
      if (err.status === 403) {
        return { title: 'No tienes permiso para ver esta información', detail: 'El servidor respondió 403.' }
      }
      if (err.status === 404) {
        return { title: 'No se encontró lo solicitado', detail: 'El servidor respondió 404.' }
      }
      if (err.status >= 500) {
        return {
          title: 'El servidor reportó un error',
          detail: `Código ${err.status}. Intenta de nuevo; si persiste, avisa al equipo de backend.`
        }
      }
      return { title: 'El servidor rechazó la solicitud', detail: `Código ${err.status}.` }
    default:
      return { title: 'Ocurrió un error inesperado', detail: (err && err.message) || '' }
  }
}
