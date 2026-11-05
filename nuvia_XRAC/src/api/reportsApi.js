// Servicios de reportes clínicos: generar, consultar, guardar borrador, confirmar e historial.
// El navegador NUNCA habla con la base de datos ni con el proveedor de IA: solo con el backend.
// No hay nada específico de un proveedor (Gemini, OpenRouter...): el backend lo decide.
import { REPORTS_SOURCE, GENERATION_TIMEOUT_MS } from './config.js'
import { apiRequest, describeError } from './client.js'
import { ENDPOINTS } from './endpoints.js'
import { normalizeReport, normalizeReportList, normalizeVersionList } from './normalizeReport.js'
import * as mock from './mock/mockReports.js'

const useApi = () => REPORTS_SOURCE === 'api'

function requireReport(raw, patientId) {
  const report = normalizeReport(raw, patientId)
  if (!report) throw Object.assign(new Error('Sin reporte'), { kind: 'parse' })
  return report
}

// Último reporte del paciente, o null si todavía no tiene (404 también se toma como "ninguno").
export async function getLatestReport(patientId, { signal } = {}) {
  try {
    const raw = useApi()
      ? await apiRequest(ENDPOINTS.latestReport(patientId), { signal })
      : await mock.getLatestReport(patientId, { signal })
    return normalizeReport(raw, patientId)
  } catch (err) {
    if (err && err.kind === 'http' && err.status === 404) return null
    throw err
  }
}

// El backend arma la solicitud al LLM desde la base de datos: aquí solo se envía el
// paciente y los ids de la información adicional ya registrada (no se reenvía el expediente).
export async function generateReport(patientId, { inputIds = [], recordGeneratedAt = null } = {}, { signal } = {}) {
  const raw = useApi()
    ? await apiRequest(ENDPOINTS.generateReport(patientId), {
        method: 'POST',
        body: { inputIds, recordGeneratedAt },
        signal,
        timeoutMs: GENERATION_TIMEOUT_MS
      })
    : await mock.generateReport(patientId, { inputIds }, { signal })
  return requireReport(raw, patientId)
}

export async function listReportVersions(reportId, { signal } = {}) {
  const raw = useApi()
    ? await apiRequest(ENDPOINTS.reportVersions(reportId), { signal })
    : await mock.listReportVersions(reportId, { signal })
  return normalizeVersionList(raw)
}

export async function getReportVersion(patientId, reportId, version, { signal } = {}) {
  const raw = useApi()
    ? await apiRequest(ENDPOINTS.reportVersion(reportId, version), { signal })
    : await mock.getReportVersion(reportId, version, { signal })
  return requireReport(raw, patientId)
}

export async function saveReportDraft(patientId, reportId, payload, { signal } = {}) {
  const raw = useApi()
    ? await apiRequest(ENDPOINTS.saveDraft(reportId), { method: 'PUT', body: payload, signal })
    : await mock.saveDraft(reportId, payload, { signal })
  return requireReport(raw, patientId)
}

// Último reporte de cada paciente. Si el backend aún no ofrece el listado (404/501/405) se devuelve
// una lista vacía: el panel principal sigue funcionando sin él.
export async function listReports({ limit = 100, signal } = {}) {
  try {
    const raw = useApi()
      ? await apiRequest(ENDPOINTS.listReports(), { params: { limit }, signal })
      : await mock.listReports({ limit }, { signal })
    return normalizeReportList(raw)
  } catch (err) {
    if (err && err.kind === 'http' && [404, 405, 501].includes(err.status)) return { items: [], total: 0 }
    throw err
  }
}

// Pasa el reporte a "En revisión" (el profesional terminó de editar y falta confirmarlo).
export async function markReportInReview(patientId, reportId, { version }, { signal } = {}) {
  const raw = useApi()
    ? await apiRequest(ENDPOINTS.markInReview(reportId), { method: 'POST', body: { version }, signal })
    : await mock.markInReview(reportId, { version }, { signal })
  return requireReport(raw, patientId)
}

export async function confirmReport(patientId, reportId, { version }, { signal } = {}) {
  const raw = useApi()
    ? await apiRequest(ENDPOINTS.confirmReport(reportId), { method: 'POST', body: { version }, signal })
    : await mock.confirmReport(reportId, { version }, { signal })
  return requireReport(raw, patientId)
}

// Clasifica por qué falló la generación para mostrar el estado correcto en pantalla.
//   not_connected : el servicio todavía no existe (501, 404 o 405)
//   unavailable   : existe pero no responde bien (503)
//   insufficient  : el servicio pide más información (422 insufficient_information)
//   connection    : no se pudo hablar con el backend (red / tiempo agotado)
//   forbidden     : sin sesión o sin permiso (401/403)
//   error         : cualquier otro fallo
export function classifyGenerationFailure(err) {
  const base = describeError(err)
  if (err && err.kind === 'http') {
    if ([501, 404, 405].includes(err.status)) return { code: 'not_connected', ...base }
    if (err.status === 503) return { code: 'unavailable', ...base }
    if (err.status === 422 && err.code === 'insufficient_information') return { code: 'insufficient', ...base }
    if ([401, 403].includes(err.status)) return { code: 'forbidden', ...base }
    return { code: 'error', ...base }
  }
  if (err && ['network', 'timeout'].includes(err.kind)) return { code: 'connection', ...base }
  return { code: 'error', ...base }
}

// Mensaje claro para fallos al guardar o confirmar (incluye conflictos de versión).
export function describeReportError(err) {
  if (err && err.kind === 'http' && err.status === 409) {
    if (err.code === 'report_confirmed') {
      return { title: 'El reporte ya fue confirmado', detail: 'Ya no se puede modificar. Recarga para ver la versión aprobada.' }
    }
    return {
      title: 'El reporte cambió en el servidor',
      detail: 'Otra persona o proceso lo modificó. Tus cambios siguen aquí sin guardar: copia lo que necesites y recarga el reporte.'
    }
  }
  return describeError(err)
}
