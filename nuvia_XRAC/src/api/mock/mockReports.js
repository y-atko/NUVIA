// Servicios simulados de información adicional y reportes. Mismo formato que el backend real.
//
// IMPORTANTE: el reporte que arma este módulo NO lo genera un modelo externo. Es una plantilla
// local que reorganiza lo que ya consta en el expediente (sin añadir nada) y así queda
// identificado en el reporte (generatedBy.label). Cuando exista el backend con el LLM, este
// archivo deja de usarse (REPORTS_SOURCE='api'); el editor y las pantallas no cambian.
//
// El estado (reportes, versiones, información adicional) se guarda en el navegador mediante
// mockStore.js para que sobreviva a una recarga mientras no haya backend.
import { ApiError } from '../client.js'
import { MOCK_PATIENTS, MOCK_RECORDS } from './mockData.js'
import { getSimulation, mockWait, failIfBackendDown } from './simulation.js'
import { createPersistence } from './mockStore.js'

const clone = (value) => JSON.parse(JSON.stringify(value))
const GENERATOR_LABEL = 'Generador local de NUVIA'
const MOCK_USER = 'Dra. Valeria Núñez' // lo que en el backend real saldría de la sesión

const SECTION_DEFS = [
  { key: 'summary', title: 'Resumen clínico' },
  { key: 'background', title: 'Antecedentes relevantes' },
  { key: 'history', title: 'Historial y evolución' },
  { key: 'recent', title: 'Información reciente' },
  { key: 'missing', title: 'Datos faltantes' },
  { key: 'contradictions', title: 'Posibles contradicciones' },
  { key: 'review', title: 'Aspectos que requieren revisión' }
]
const RECORD_TO_REPORT = {
  motivo: 'summary',
  antecedentes: 'background',
  historial: 'history',
  diagnosticos: 'history',
  consultas: 'history',
  medicamentos: 'history',
  evolucion: 'history',
  estudios: 'recent',
  signos: 'recent',
  signos_estudios: 'recent'
}
const ALERT_TO_REPORT = { missing: 'missing', contradiction: 'contradictions', review: 'review' }

let persistence = createPersistence()
export const setMockPersistence = (next) => {
  persistence = next
  state = null // fuerza a recargar desde la nueva persistencia
}

let state = null // { counter, inputs: {id: input}, reports: {patientId: {id, versions: []}} }
const commit = () => persistence.save(state)

function ensure() {
  if (state) return state
  const saved = persistence.load()
  if (saved && saved.reports && saved.inputs) {
    state = saved
  } else {
    state = { counter: 0, inputs: {}, reports: {} }
    seed()
    commit()
  }
  return state
}

const nextId = (prefix) => `${prefix}-${++state.counter}`
const latestOf = (entry) => entry.versions[entry.versions.length - 1]
const findEntry = (reportId) => Object.values(ensure().reports).find((e) => e.id === reportId)
const labelOf = (patientId) => (MOCK_PATIENTS.find((p) => p.id === patientId) || {}).label || patientId

// ---------- Plantilla local ----------
function buildLocalReport(patientId, inputs, reportId, now) {
  const record = MOCK_RECORDS[patientId]
  const sections = SECTION_DEFS.map((def) => ({ ...def, items: [] }))
  const bucket = (key) => sections.find((s) => s.key === key)
  let n = 0
  const itemId = () => `${reportId}-i${++n}`

  record.summary.sections.forEach((section) => {
    const target = bucket(RECORD_TO_REPORT[section.key] || 'history')
    section.items.forEach((item) =>
      target.items.push({ id: itemId(), text: item.text, kind: 'statement', authorship: 'ai', status: item.status, sourceIds: [...item.sourceIds] })
    )
  })
  record.alerts.forEach((alert) => {
    bucket(ALERT_TO_REPORT[alert.type] || 'review').items.push({
      id: itemId(),
      text: alert.description ? `${alert.title}: ${alert.description}` : alert.title,
      kind: alert.type === 'missing' ? 'absence' : 'statement',
      authorship: 'ai',
      status: 'needs_review',
      sourceIds: [...alert.sourceIds]
    })
  })

  const sources = clone(record.sources)
  inputs.forEach((input) => {
    const sourceId = `src-${input.id}`
    sources.push({ id: sourceId, kind: input.kind === 'transcription' ? 'transcription' : 'input', label: input.label, excerpt: input.text })
    bucket('recent').items.push({
      id: itemId(),
      text: `${input.kind === 'transcription' ? 'Transcripción revisada' : 'Información aportada en la consulta'}: ${input.text}`,
      kind: 'statement', authorship: 'ai', status: 'documented', sourceIds: [sourceId]
    })
  })

  return {
    id: reportId, patientId, status: 'generated', version: 1, generatedVersion: 1,
    isTestData: true,
    generatedBy: { label: GENERATOR_LABEL, model: null },
    createdAt: now, updatedAt: now, confirmedAt: null, confirmedBy: null, savedBy: null,
    observations: '', notices: [], sections, sources
  }
}

function appendVersion(entry, patch) {
  const next = { ...clone(latestOf(entry)), ...patch, version: latestOf(entry).version + 1 }
  entry.versions.push(next)
  return next
}

// ---------- Datos iniciales: reportes en distintos estados ----------
function seed() {
  const make = (patientId, at) => {
    const reportId = `rep-${patientId}-1`
    const entry = { id: reportId, versions: [buildLocalReport(patientId, [], reportId, at)] }
    state.reports[patientId] = entry
    return entry
  }
  const edit = (report, sectionKey, text) => {
    const item = report.sections.find((s) => s.key === sectionKey).items[0]
    item.originalText = item.text
    item.text = text
    item.edited = true
  }
  const addPro = (report, sectionKey, text) => {
    const section = report.sections.find((s) => s.key === sectionKey)
    section.items.push({ id: `${report.id}-n${section.items.length + 1}`, text, kind: 'statement', authorship: 'professional', edited: false, originalText: null, status: 'documented', sourceIds: [] })
  }
  const draft = (entry, at, fn) => {
    const v = appendVersion(entry, { status: 'draft', updatedAt: at, savedBy: MOCK_USER })
    fn && fn(v)
    return v
  }
  const review = (entry, at) => appendVersion(entry, { status: 'in_review', updatedAt: at, savedBy: MOCK_USER })
  const confirm = (entry, at) => appendVersion(entry, { status: 'confirmed', updatedAt: at, confirmedAt: at, confirmedBy: MOCK_USER, savedBy: MOCK_USER })

  // En revisión
  let e = make('EXP-1042', '2026-10-28T09:00:00Z')
  draft(e, '2026-10-28T09:30:00Z', (v) => {
    edit(v, 'background', 'Hipertensión arterial referida desde hace varios años; en tratamiento con losartán.')
    addPro(v, 'recent', 'Se revisó el esquema de medicamentos con la paciente.')
    v.observations = 'Pendiente confirmar la dosis de metformina en la próxima consulta.'
  })
  review(e, '2026-10-28T10:15:00Z')

  // Borrador guardado
  e = make('EXP-1187', '2026-10-27T16:00:00Z')
  draft(e, '2026-10-27T16:20:00Z', (v) => {
    edit(v, 'summary', 'Acudió a urgencias por cefalea de cuatro días, sin otros síntomas referidos.')
    addPro(v, 'missing', 'Se solicitará al paciente información sobre alergias y medicamentos.')
    v.observations = 'Expediente con poca información: completar en la consulta.'
  })

  // Confirmado (historial completo)
  e = make('EXP-1203', '2026-10-24T11:00:00Z')
  draft(e, '2026-10-24T11:30:00Z', (v) => { v.observations = 'Contradicciones revisadas con el expediente impreso.' })
  review(e, '2026-10-24T12:00:00Z')
  confirm(e, '2026-10-24T12:30:00Z')

  // Confirmado directamente
  e = make('EXP-1402', '2026-10-23T08:30:00Z')
  confirm(e, '2026-10-23T08:50:00Z')

  // En revisión
  e = make('EXP-1466', '2026-10-29T10:00:00Z')
  draft(e, '2026-10-29T10:20:00Z', (v) => addPro(v, 'recent', 'El paciente refiere mejoría parcial con reposo relativo.'))
  review(e, '2026-10-29T10:40:00Z')

  // Recién generado (borrador sin ediciones)
  make('EXP-1519', '2026-11-01T09:00:00Z')
}

const requirePatient = (patientId) => {
  if (!MOCK_RECORDS[patientId]) throw new ApiError('Paciente no encontrado', { kind: 'http', status: 404 })
}

// ---------- Operaciones (equivalentes a los endpoints) ----------
export async function submitInputs(patientId, inputs, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  requirePatient(patientId)
  ensure()
  const items = inputs.map((input) => {
    const stored = { id: nextId('inp'), patientId, kind: input.kind, label: input.label || null, text: String(input.text ?? '') }
    state.inputs[stored.id] = stored
    return { id: stored.id, kind: stored.kind, label: stored.label, text: stored.text }
  })
  commit()
  return { items }
}

export async function getLatestReport(patientId, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  requirePatient(patientId)
  const entry = ensure().reports[patientId]
  return { report: entry ? clone(latestOf(entry)) : null }
}

// Último reporte de cada paciente (más reciente primero). Alimenta el panel principal y "Reportes".
export async function listReports({ limit = 100 } = {}, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  const items = Object.entries(ensure().reports)
    .map(([patientId, entry]) => {
      const v = latestOf(entry)
      return {
        id: entry.id, patientId, patientLabel: labelOf(patientId), status: v.status, version: v.version,
        updatedAt: v.updatedAt, confirmedAt: v.confirmedAt, confirmedBy: v.confirmedBy
      }
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  return { items: items.slice(0, limit), total: items.length }
}

export async function generateReport(patientId, { inputIds = [] } = {}, { signal } = {}) {
  await mockWait(signal, 900)
  failIfBackendDown()
  requirePatient(patientId)
  ensure()

  const simulated = (status, code, message) => new ApiError(message, { kind: 'http', status, code, simulated: true })
  switch (getSimulation().ai) {
    case 'not_connected': throw simulated(501, 'not_implemented', 'Generación no habilitada')
    case 'unavailable': throw simulated(503, 'ai_unavailable', 'Servicio no disponible')
    case 'error': throw simulated(500, 'generation_failed', 'Falló la generación')
    case 'insufficient': throw simulated(422, 'insufficient_information', 'Información insuficiente')
    default: break
  }

  const inputs = inputIds.map((id) => state.inputs[id])
  if (inputs.some((input) => !input || input.patientId !== patientId)) {
    throw new ApiError('Información adicional no encontrada para este paciente', { kind: 'http', status: 422, code: 'unknown_input' })
  }
  const record = MOCK_RECORDS[patientId]
  const recordEmpty = record.summary.sections.length === 0 && record.alerts.length === 0 && record.records.length === 0
  if (recordEmpty && inputs.length === 0) {
    throw new ApiError('Información insuficiente', { kind: 'http', status: 422, code: 'insufficient_information' })
  }

  const reportId = nextId(`rep-${patientId}`)
  const report = buildLocalReport(patientId, inputs, reportId, new Date().toISOString())
  state.reports[patientId] = { id: reportId, versions: [report] }
  commit()
  return { report: clone(report) }
}

export async function listReportVersions(reportId, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  const entry = findEntry(reportId)
  if (!entry) throw new ApiError('Reporte no encontrado', { kind: 'http', status: 404 })
  const notes = { generated: 'Versión inicial', draft: 'Borrador guardado', in_review: 'Enviado a revisión', confirmed: 'Confirmado por el profesional' }
  return {
    items: entry.versions.map((v) => ({
      version: v.version, status: v.status, savedAt: v.updatedAt, savedBy: v.savedBy || null, note: notes[v.status]
    }))
  }
}

export async function getReportVersion(reportId, version, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  const entry = findEntry(reportId)
  const found = entry && entry.versions.find((v) => v.version === Number(version))
  if (!found) throw new ApiError('Versión no encontrada', { kind: 'http', status: 404 })
  return { report: clone(found) }
}

function requireEditable(entry, version) {
  const latest = latestOf(entry)
  if (latest.status === 'confirmed') throw new ApiError('El reporte ya está confirmado', { kind: 'http', status: 409, code: 'report_confirmed' })
  if (version !== latest.version) throw new ApiError('El reporte cambió en el servidor', { kind: 'http', status: 409, code: 'version_conflict' })
  return latest
}

export async function saveDraft(reportId, payload, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  const entry = findEntry(reportId)
  if (!entry) throw new ApiError('Reporte no encontrado', { kind: 'http', status: 404 })
  const latest = requireEditable(entry, payload.baseVersion)
  if (!Array.isArray(payload.sections)) throw new ApiError('Formato no válido', { kind: 'http', status: 422, code: 'invalid_payload' })

  let n = latest.sections.reduce((acc, s) => acc + s.items.length, 0) + 100
  const sections = payload.sections.map((section) => ({
    key: section.key, title: section.title,
    items: section.items.map((item) => ({
      ...item,
      // El backend asigna los ids definitivos a los elementos nuevos ("local-*").
      id: String(item.id).startsWith('local-') ? `${reportId}-n${++n}` : item.id
    }))
  }))
  // Guardar siempre deja el reporte como borrador (aunque estuviera en revisión).
  const next = appendVersion(entry, {
    status: 'draft', sections, observations: payload.observations || '',
    updatedAt: new Date().toISOString(), savedBy: MOCK_USER
  })
  commit()
  return { report: clone(next) }
}

export async function markInReview(reportId, { version }, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  const entry = findEntry(reportId)
  if (!entry) throw new ApiError('Reporte no encontrado', { kind: 'http', status: 404 })
  requireEditable(entry, version)
  const next = appendVersion(entry, { status: 'in_review', updatedAt: new Date().toISOString(), savedBy: MOCK_USER })
  commit()
  return { report: clone(next) }
}

export async function confirmReport(reportId, { version }, { signal } = {}) {
  await mockWait(signal)
  failIfBackendDown()
  const entry = findEntry(reportId)
  if (!entry) throw new ApiError('Reporte no encontrado', { kind: 'http', status: 404 })
  requireEditable(entry, version)
  const now = new Date().toISOString()
  const next = appendVersion(entry, { status: 'confirmed', updatedAt: now, confirmedAt: now, confirmedBy: MOCK_USER, savedBy: MOCK_USER })
  commit()
  return { report: clone(next) }
}

// Vuelve a los datos de ejemplo iniciales (borra también lo guardado en el navegador).
export function resetMockReports() {
  persistence.clear()
  state = null
  ensure()
}
