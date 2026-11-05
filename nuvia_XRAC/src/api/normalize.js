// Convierte la respuesta del backend (o del mock) en el modelo que usa la interfaz.
// Principios:
//  - Tolerante: campos ausentes o con tipo inesperado no rompen la pantalla.
//  - Nunca inventa datos: lo que falta queda en null/[] y la interfaz lo dice.
//  - Una afirmación solo se muestra como "respaldada" si al menos una de sus
//    fuentes existe de verdad en la lista `sources`. Si no, es "unverified".
// Formato esperado: docs/API_CONTRACT.md

export const CLAIM_STATUSES = ['documented', 'needs_review']
const ALERT_TYPES = ['missing', 'contradiction', 'review']
export const SOURCE_KINDS = ['record', 'input', 'transcription']

export const asArray = (value) => (Array.isArray(value) ? value : [])
export const asText = (value) => (value === undefined || value === null ? '' : String(value))
export const asOptionalText = (value) => {
  const text = asText(value).trim()
  return text === '' ? null : text
}
export const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

export function normalizeSource(raw) {
  if (!isObject(raw)) return null
  const id = asText(raw.id).trim()
  if (!id) return null // sin id no se puede referenciar desde ninguna afirmación
  return {
    id,
    table: asOptionalText(raw.table),
    recordId: asOptionalText(raw.recordId),
    date: asOptionalText(raw.date),
    field: asOptionalText(raw.field),
    excerpt: asOptionalText(raw.excerpt),
    // 'record' = registro del expediente; 'input' = texto introducido por el profesional en la
    // consulta; 'transcription' = transcripción de audio revisada. Desconocido => 'record'.
    kind: SOURCE_KINDS.includes(raw.kind) ? raw.kind : 'record',
    label: asOptionalText(raw.label)
  }
}

export function resolveSources(ids, sourcesById) {
  const resolved = []
  const unresolved = []
  const seen = new Set()
  asArray(ids)
    .map((id) => asText(id).trim())
    .filter(Boolean)
    .forEach((id) => {
      if (seen.has(id)) return
      seen.add(id)
      const source = sourcesById.get(id)
      if (source) resolved.push(source)
      else unresolved.push(id)
    })
  return { resolved, unresolved }
}

function normalizeItem(raw, sourcesById, sectionKey, index) {
  const item = isObject(raw) ? raw : {}
  const { resolved, unresolved } = resolveSources(item.sourceIds, sourcesById)
  const declaredStatus = CLAIM_STATUSES.includes(item.status) ? item.status : 'needs_review'

  let displayStatus
  if (resolved.length === 0) displayStatus = 'unverified'
  else displayStatus = declaredStatus === 'documented' ? 'documented' : 'needs_review'

  return {
    id: asText(item.id).trim() || `${sectionKey}-${index}`,
    text: asText(item.text).trim(),
    date: asOptionalText(item.date),
    declaredStatus,
    displayStatus, // 'documented' | 'needs_review' | 'unverified'
    sources: resolved,
    unresolvedSourceIds: unresolved
  }
}

function normalizeAlert(raw, sourcesById, index) {
  const alert = isObject(raw) ? raw : {}
  const { resolved, unresolved } = resolveSources(alert.sourceIds, sourcesById)
  return {
    id: asText(alert.id).trim() || `alert-${index}`,
    // Un tipo desconocido se muestra como "por revisar": nunca se oculta una alerta.
    type: ALERT_TYPES.includes(alert.type) ? alert.type : 'review',
    title: asText(alert.title).trim() || 'Alerta sin título',
    description: asOptionalText(alert.description),
    claimIds: asArray(alert.claimIds).map((id) => asText(id).trim()).filter(Boolean),
    sources: resolved,
    unresolvedSourceIds: unresolved
  }
}

function normalizeRecordEntry(raw) {
  if (!isObject(raw)) return null
  const fields = isObject(raw.fields)
    ? Object.entries(raw.fields).map(([label, value]) => ({ label, value: asText(value) }))
    : []
  return {
    table: asOptionalText(raw.table),
    recordId: asOptionalText(raw.recordId),
    date: asOptionalText(raw.date),
    fields
  }
}

export function normalizeRecord(raw, fallbackPatientId = '') {
  const root = isObject(raw) ? raw : {}
  const meta = isObject(root.meta) ? root.meta : {}
  const patientRaw = isObject(root.patient) ? root.patient : {}

  const sources = asArray(root.sources).map(normalizeSource).filter(Boolean)
  const sourcesById = new Map()
  sources.forEach((source) => {
    if (!sourcesById.has(source.id)) sourcesById.set(source.id, source)
  })

  const summary = isObject(root.summary) ? root.summary : {}
  const sections = asArray(summary.sections)
    .filter(isObject)
    .map((section, sectionIndex) => {
      const key = asText(section.key).trim() || `section-${sectionIndex}`
      return {
        key,
        title: asText(section.title).trim() || 'Sección sin título',
        items: asArray(section.items).map((item, i) => normalizeItem(item, sourcesById, key, i))
      }
    })

  const alerts = asArray(root.alerts).map((alert, i) => normalizeAlert(alert, sourcesById, i))
  const records = asArray(root.records).map(normalizeRecordEntry).filter(Boolean)

  const allItems = sections.flatMap((section) => section.items)
  const counts = {
    claims: allItems.length,
    unverifiedClaims: allItems.filter((item) => item.displayStatus === 'unverified').length,
    contradiction: alerts.filter((a) => a.type === 'contradiction').length,
    review: alerts.filter((a) => a.type === 'review').length,
    missing: alerts.filter((a) => a.type === 'missing').length
  }

  const patientId = asText(patientRaw.id).trim() || asText(fallbackPatientId)
  return {
    meta: {
      contractVersion: asOptionalText(meta.contractVersion),
      isTestData: meta.isTestData === true,
      generatedAt: asOptionalText(meta.generatedAt),
      summaryOrigin: asOptionalText(meta.summaryOrigin),
      notes: asOptionalText(meta.notes)
    },
    patient: {
      id: patientId,
      label: asText(patientRaw.label).trim() || patientId,
      age: asOptionalText(patientRaw.age),
      sex: asOptionalText(patientRaw.sex),
      identifiers: asArray(patientRaw.identifiers)
        .filter(isObject)
        .map((entry) => ({ label: asText(entry.label).trim(), value: asText(entry.value).trim() }))
        .filter((entry) => entry.label && entry.value),
      // Datos generales opcionales para la tarjeta "Información general" (p. ej. servicio, último ingreso).
      details: asArray(patientRaw.details)
        .filter(isObject)
        .map((entry) => ({ label: asText(entry.label).trim(), value: asText(entry.value).trim() }))
        .filter((entry) => entry.label && entry.value)
    },
    sections,
    alerts,
    records,
    counts,
    // Sin afirmaciones, sin alertas y sin registros: no hay nada que resumir.
    isEmpty: allItems.length === 0 && alerts.length === 0 && records.length === 0
  }
}

export function normalizeListResponse(raw) {
  const rawItems = Array.isArray(raw) ? raw : isObject(raw) ? raw.items : []
  const items = asArray(rawItems)
    .filter(isObject)
    .map((entry) => {
      const id = asText(entry.id).trim()
      if (!id) return null
      return {
        id,
        label: asText(entry.label).trim() || id,
        age: asOptionalText(entry.age),
        sex: asOptionalText(entry.sex),
        lastRecordDate: asOptionalText(entry.lastRecordDate),
        note: asOptionalText(entry.note)
      }
    })
    .filter(Boolean)

  // El total solo se usa si el backend lo envía; si no, es null (nunca se supone).
  const total = isObject(raw) && Number.isFinite(raw.total) ? raw.total : null
  return { items, total }
}

// Busca el registro original completo que corresponde a una fuente (tabla + id de registro).
export function findRecordForSource(records, source) {
  if (!source || (source.kind && source.kind !== 'record') || !source.table || !source.recordId) return null
  return (
    asArray(records).find(
      (record) => record.table === source.table && record.recordId === source.recordId
    ) || null
  )
}
