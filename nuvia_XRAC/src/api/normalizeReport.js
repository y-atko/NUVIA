// Convierte la respuesta de reportes del backend (o del mock) en el modelo de la interfaz.
// Mismos principios que normalize.js: tolerante, nunca inventa datos, y una afirmación
// solo cuenta como respaldada si su fuente existe de verdad.
// Además aplica una regla de seguridad: un reporte que no identifica al paciente
// seleccionado, o que pertenece a otro, se RECHAZA (nunca se muestra).
// Formato: docs/API_CONTRACT_REPORTES.md
import { ApiError } from './client.js'
import {
  CLAIM_STATUSES,
  asArray,
  asText,
  asOptionalText,
  isObject,
  normalizeSource,
  resolveSources
} from './normalize.js'

export const REPORT_STATUSES = ['generated', 'draft', 'in_review', 'confirmed']

function normalizeReportItem(raw, sourcesById, sectionKey, index) {
  const item = isObject(raw) ? raw : {}
  const { resolved, unresolved } = resolveSources(item.sourceIds, sourcesById)
  const authorship = item.authorship === 'professional' ? 'professional' : 'ai'
  const kind = item.kind === 'absence' ? 'absence' : 'statement'
  const declaredStatus = CLAIM_STATUSES.includes(item.status) ? item.status : 'needs_review'

  let displayStatus
  if (resolved.length > 0) displayStatus = declaredStatus === 'documented' ? 'documented' : 'needs_review'
  else if (kind === 'absence') displayStatus = 'missing' // "no documentado": no necesita registro de origen
  else if (authorship === 'professional') displayStatus = 'professional' // lo aportó el profesional
  else displayStatus = 'unverified'

  const edited = item.edited === true && authorship === 'ai'
  return {
    id: asText(item.id).trim() || `${sectionKey}-${index}`,
    text: asText(item.text).trim(),
    kind,
    authorship, // 'ai' | 'professional'
    edited, // el profesional modificó un texto generado por IA
    originalText: edited ? asOptionalText(item.originalText) : null,
    declaredStatus,
    displayStatus, // 'documented' | 'needs_review' | 'unverified' | 'missing' | 'professional'
    // Se conservan TODOS los ids citados (también los no resueltos) para poder reenviarlos al guardar.
    sourceIds: [...resolved.map((s) => s.id), ...unresolved],
    sources: resolved,
    unresolvedSourceIds: unresolved
  }
}

// Acepta { report: {...} } o el reporte directamente. Devuelve null si no hay reporte.
export function normalizeReport(raw, expectedPatientId) {
  const root = isObject(raw) && 'report' in raw ? raw.report : raw
  if (root === null || root === undefined) return null
  if (!isObject(root)) throw new ApiError('El reporte no tiene el formato esperado', { kind: 'parse' })

  const patientId = asText(root.patientId).trim()
  if (!patientId || patientId !== asText(expectedPatientId).trim()) {
    throw new ApiError('El reporte no corresponde al paciente seleccionado', { kind: 'mismatch' })
  }
  const id = asText(root.id).trim()
  if (!id) throw new ApiError('El reporte no incluye identificador', { kind: 'parse' })

  const sources = asArray(root.sources).map(normalizeSource).filter(Boolean)
  const sourcesById = new Map()
  sources.forEach((source) => {
    if (!sourcesById.has(source.id)) sourcesById.set(source.id, source)
  })

  const sections = asArray(root.sections)
    .filter(isObject)
    .map((section, sectionIndex) => {
      const key = asText(section.key).trim() || `section-${sectionIndex}`
      return {
        key,
        title: asText(section.title).trim() || 'Sección sin título',
        items: asArray(section.items).map((item, i) => normalizeReportItem(item, sourcesById, key, i))
      }
    })

  const generatedBy = isObject(root.generatedBy)
    ? { label: asOptionalText(root.generatedBy.label), model: asOptionalText(root.generatedBy.model) }
    : null

  return {
    id,
    patientId,
    // Un estado desconocido se trata como borrador: editable y NUNCA como aprobado.
    status: REPORT_STATUSES.includes(root.status) ? root.status : 'draft',
    version: Number.isInteger(root.version) ? root.version : null,
    generatedVersion: Number.isInteger(root.generatedVersion) ? root.generatedVersion : null,
    isTestData: root.isTestData === true,
    generatedBy,
    createdAt: asOptionalText(root.createdAt),
    updatedAt: asOptionalText(root.updatedAt),
    confirmedAt: asOptionalText(root.confirmedAt),
    confirmedBy: asOptionalText(root.confirmedBy),
    observations: asText(root.observations),
    notices: asArray(root.notices).map((n) => asText(n).trim()).filter(Boolean),
    sections,
    sources
  }
}

// Lista del historial de versiones de un reporte (más reciente primero).
export function normalizeVersionList(raw) {
  const rawItems = Array.isArray(raw) ? raw : isObject(raw) ? raw.items : []
  return asArray(rawItems)
    .filter(isObject)
    .map((entry) => ({
      version: Number.isInteger(entry.version) ? entry.version : null,
      status: REPORT_STATUSES.includes(entry.status) ? entry.status : 'draft',
      savedAt: asOptionalText(entry.savedAt),
      savedBy: asOptionalText(entry.savedBy),
      note: asOptionalText(entry.note)
    }))
    .filter((entry) => entry.version !== null)
    .sort((a, b) => b.version - a.version)
}

// Información adicional ya registrada por el backend (con id asignado).
export function normalizeSubmittedInputs(raw) {
  const rawItems = Array.isArray(raw) ? raw : isObject(raw) ? raw.items : []
  const items = asArray(rawItems)
    .filter(isObject)
    .map((entry) => ({
      id: asText(entry.id).trim(),
      kind: entry.kind === 'transcription' ? 'transcription' : 'input',
      label: asOptionalText(entry.label),
      text: asText(entry.text)
    }))
    .filter((entry) => entry.id)
  if (items.length === 0 && asArray(rawItems).length > 0) {
    throw new ApiError('El servidor no devolvió identificadores para la información enviada', { kind: 'parse' })
  }
  return items
}

// Resultado de una transcripción. Nunca se fabrica texto: sin texto => error.
export function normalizeTranscription(raw) {
  const root = isObject(raw) ? raw : {}
  if (typeof root.text !== 'string') {
    throw new ApiError('La respuesta de transcripción no incluye texto', { kind: 'parse' })
  }
  return {
    text: root.text,
    language: asOptionalText(root.language),
    durationSec: Number.isFinite(root.durationSec) ? root.durationSec : null,
    isSynthetic: root.isSynthetic === true,
    provider: asOptionalText(root.provider)
  }
}

// Resumen del último reporte de cada paciente (para el panel principal y la pantalla Reportes).
export function normalizeReportList(raw) {
  const rawItems = Array.isArray(raw) ? raw : isObject(raw) ? raw.items : []
  const items = asArray(rawItems)
    .filter(isObject)
    .map((entry) => {
      const id = asText(entry.id).trim()
      const patientId = asText(entry.patientId).trim()
      if (!id || !patientId) return null
      return {
        id,
        patientId,
        patientLabel: asText(entry.patientLabel).trim() || patientId,
        // Un estado desconocido se trata como borrador: nunca como aprobado.
        status: REPORT_STATUSES.includes(entry.status) ? entry.status : 'draft',
        version: Number.isInteger(entry.version) ? entry.version : null,
        updatedAt: asOptionalText(entry.updatedAt),
        confirmedAt: asOptionalText(entry.confirmedAt),
        confirmedBy: asOptionalText(entry.confirmedBy)
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  return { items, total: isObject(raw) && Number.isFinite(raw.total) ? raw.total : items.length }
}
