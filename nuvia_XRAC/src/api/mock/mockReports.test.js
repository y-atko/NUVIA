import test from 'node:test'
import assert from 'node:assert/strict'
import * as reports from '../reportsApi.js'
import { submitConsultationInputs } from '../consultationApi.js'
import { transcribeAudio } from '../transcriptionApi.js'
import { setSimulation, resetSimulation, setMockLatency } from './simulation.js'
import { createEditorState, editorReducer, toDraftPayload } from '../../report/reportEditor.js'
import { getServiceStatuses } from '../serviceStatus.js'
import { resetMockReports, setMockPersistence } from './mockReports.js'
import { createPersistence } from './mockStore.js'

setMockLatency(0)
const memoryStorage = () => {
  const data = {}
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v) }, removeItem: (k) => { delete data[k] } }
}
let storage
test.beforeEach(() => {
  resetSimulation()
  storage = memoryStorage()
  setMockPersistence(createPersistence(() => storage))
  resetMockReports()
})

const fail = async (promise) => promise.then(() => assert.fail('debía fallar'), (e) => e)
const edit = (report, text) =>
  editorReducer(createEditorState(report), { type: 'editItem', sectionKey: 'summary', itemId: report.sections[0].items[0].id, text })

test('por defecto el reporte lo arma el generador LOCAL y así queda identificado (no es un modelo externo)', async () => {
  const r = await reports.generateReport('EXP-1311', { inputIds: [] })
  assert.equal(r.status, 'generated')
  assert.equal(r.generatedBy.label, 'Generador local de NUVIA')
  assert.equal(r.generatedBy.model, null)
  assert.equal(r.sections.map((s) => s.key).join(), 'summary,background,history,recent,missing,contradictions,review')
})

test('el reporte local no añade nada: cada afirmación procede del expediente y cita fuentes que existen', async () => {
  const r = await reports.generateReport('EXP-1042', { inputIds: [] })
  const ids = new Set(r.sources.map((s) => s.id))
  const items = r.sections.flatMap((s) => s.items)
  assert.ok(items.length >= 10)
  items.forEach((i) => assert.ok(i.sourceIds.every((id) => ids.has(id))))
})

test('cada escenario de fallo se clasifica con su estado', async () => {
  const expected = { not_connected: 'not_connected', unavailable: 'unavailable', error: 'error', insufficient: 'insufficient' }
  for (const [scenario, code] of Object.entries(expected)) {
    setSimulation('ai', scenario)
    const err = await fail(reports.generateReport('EXP-1311', {}))
    assert.equal(reports.classifyGenerationFailure(err).code, code, scenario)
  }
})

test('fallo de conexión con el backend se clasifica como "connection"; un 500 como "error"', async () => {
  setSimulation('api', 'offline')
  assert.equal(reports.classifyGenerationFailure(await fail(reports.generateReport('EXP-1311', {}))).code, 'connection')
  setSimulation('api', 'error')
  assert.equal(reports.classifyGenerationFailure(await fail(reports.generateReport('EXP-1311', {}))).code, 'error')
})

test('clasificación de 401/403/404/422 y de errores de red reales', () => {
  const http = (status, code) => Object.assign(new Error('x'), { kind: 'http', status, code })
  assert.equal(reports.classifyGenerationFailure(http(403)).code, 'forbidden')
  assert.equal(reports.classifyGenerationFailure(http(404)).code, 'not_connected')
  assert.equal(reports.classifyGenerationFailure(http(422, 'insufficient_information')).code, 'insufficient')
  assert.equal(reports.classifyGenerationFailure(http(422, 'otra')).code, 'error')
  assert.equal(reports.classifyGenerationFailure({ kind: 'timeout' }).code, 'connection')
})

test('la información revisada se cita como fuente distinta del expediente', async () => {
  const submitted = await submitConsultationInputs('EXP-1311', [
    { kind: 'input', label: 'Información aportada', text: 'Dato escrito por el profesional' },
    { kind: 'transcription', label: 'Transcripción revisada', text: 'Texto transcrito' }
  ])
  const r = await reports.generateReport('EXP-1311', { inputIds: submitted.map((i) => i.id) })
  assert.deepEqual(r.sources.filter((s) => s.kind !== 'record').map((s) => s.kind), ['input', 'transcription'])
  const recent = r.sections.find((s) => s.key === 'recent').items
  assert.ok(recent.some((i) => i.sources.some((s) => s.kind === 'input') && i.text.includes('Dato escrito por el profesional')))
})

test('expediente vacío y sin información adicional => información insuficiente', async () => {
  assert.equal(reports.classifyGenerationFailure(await fail(reports.generateReport('EXP-1355', {}))).code, 'insufficient')
  const [input] = await submitConsultationInputs('EXP-1355', [{ kind: 'input', text: 'Algo aportado' }])
  assert.equal((await reports.generateReport('EXP-1355', { inputIds: [input.id] })).status, 'generated')
})

test('no se puede usar información adicional de OTRO paciente', async () => {
  const [input] = await submitConsultationInputs('EXP-1311', [{ kind: 'input', text: 'De otro paciente' }])
  assert.equal((await fail(reports.generateReport('EXP-1355', { inputIds: [input.id] }))).status, 422)
})

test('ciclo completo: generar -> guardar -> enviar a revisión -> confirmar, con historial de versiones', async () => {
  const generated = await reports.generateReport('EXP-1311', {})
  const s = editorReducer(edit(generated, 'Texto corregido'), { type: 'addItem', sectionKey: 'review', text: 'Observación nueva' })

  const draft = await reports.saveReportDraft('EXP-1311', generated.id, toDraftPayload(s))
  assert.deepEqual([draft.status, draft.version], ['draft', 2])
  assert.equal(draft.sections[0].items[0].edited, true)
  assert.equal(draft.sections[0].items[0].originalText, generated.sections[0].items[0].text)
  const added = draft.sections[6].items.at(-1)
  assert.equal(added.authorship, 'professional')
  assert.doesNotMatch(added.id, /^local-/)

  const inReview = await reports.markReportInReview('EXP-1311', generated.id, { version: draft.version })
  assert.deepEqual([inReview.status, inReview.version], ['in_review', 3])

  const confirmed = await reports.confirmReport('EXP-1311', generated.id, { version: inReview.version })
  assert.deepEqual([confirmed.status, confirmed.version], ['confirmed', 4])
  assert.ok(confirmed.confirmedAt && confirmed.confirmedBy)

  const history = await reports.listReportVersions(generated.id)
  assert.deepEqual(history.map((h) => [h.version, h.status]), [[4, 'confirmed'], [3, 'in_review'], [2, 'draft'], [1, 'generated']])
  assert.equal((await reports.getLatestReport('EXP-1311')).version, 4)
})

test('guardar un reporte "En revisión" lo devuelve a borrador', async () => {
  const rep = await reports.getLatestReport('EXP-1042')
  assert.equal(rep.status, 'in_review')
  const saved = await reports.saveReportDraft('EXP-1042', rep.id, toDraftPayload(edit(rep, 'Cambio posterior a la revisión')))
  assert.equal(saved.status, 'draft')
})

test('se puede confirmar directamente desde el borrador recién generado', async () => {
  const rep = await reports.getLatestReport('EXP-1519')
  assert.equal(rep.status, 'generated')
  assert.equal((await reports.confirmReport('EXP-1519', rep.id, { version: rep.version })).status, 'confirmed')
})

test('restaurar la versión original: la versión 1 conserva el texto generado intacto', async () => {
  const generated = await reports.generateReport('EXP-1311', {})
  await reports.saveReportDraft('EXP-1311', generated.id, toDraftPayload(edit(generated, 'Cambiado')))
  const v1 = await reports.getReportVersion('EXP-1311', generated.id, generated.generatedVersion)
  assert.equal(v1.sections[0].items[0].text, generated.sections[0].items[0].text)
  assert.equal(v1.status, 'generated')
})

test('un reporte confirmado no admite guardar, enviar a revisión ni confirmar de nuevo (409)', async () => {
  const latest = await reports.getLatestReport('EXP-1203')
  assert.equal(latest.status, 'confirmed')
  const body = { baseVersion: latest.version, sections: [], observations: '' }
  for (const op of [
    () => reports.saveReportDraft('EXP-1203', latest.id, body),
    () => reports.markReportInReview('EXP-1203', latest.id, { version: latest.version }),
    () => reports.confirmReport('EXP-1203', latest.id, { version: latest.version })
  ]) {
    const err = await fail(op())
    assert.deepEqual([err.status, err.code], [409, 'report_confirmed'])
  }
  assert.match(reports.describeReportError(await fail(reports.confirmReport('EXP-1203', latest.id, { version: 1 }))).title, /confirmado/)
})

test('conflicto de versión: guardar sobre una versión vieja falla con mensaje claro', async () => {
  const latest = await reports.getLatestReport('EXP-1187')
  const err = await fail(reports.saveReportDraft('EXP-1187', latest.id, { baseVersion: latest.version - 1, sections: [], observations: '' }))
  assert.equal(err.code, 'version_conflict')
  assert.match(reports.describeReportError(err).detail, /sin guardar/)
})

test('datos iniciales: un reporte en cada estado y pacientes sin reporte', async () => {
  const status = async (id) => (await reports.getLatestReport(id))?.status ?? null
  assert.deepEqual(
    await Promise.all(['EXP-1042', 'EXP-1187', 'EXP-1203', 'EXP-1402', 'EXP-1466', 'EXP-1519', 'EXP-1311', 'EXP-1355'].map(status)),
    ['in_review', 'draft', 'confirmed', 'confirmed', 'in_review', 'generated', null, null]
  )
})

test('listado de reportes: el último de cada paciente, más reciente primero, con el nombre del paciente', async () => {
  const { items, total } = await reports.listReports()
  assert.equal(total, 6)
  assert.deepEqual(items.map((i) => i.patientId), ['EXP-1519', 'EXP-1466', 'EXP-1042', 'EXP-1187', 'EXP-1203', 'EXP-1402'])
  assert.equal(items[0].patientLabel, 'Sofía Alejandra Medina Cavazos')
  const { isPending } = await import('../../report/reportStatus.js')
  assert.equal(items.filter((i) => isPending(i.status)).length, 4)
  assert.equal(items.filter((i) => i.status === 'confirmed').length, 2)
})

test('un reporte pedido para un paciente no puede devolver el de otro', async () => {
  const rep = await reports.getLatestReport('EXP-1187')
  assert.equal((await fail(reports.getReportVersion('EXP-1203', rep.id, 1))).kind, 'mismatch')
})

test('transcripción: sin servicio NO hay texto (nunca se inventa); un error se propaga', async () => {
  assert.deepEqual(await transcribeAudio('EXP-1042', { name: 'a.m4a' }), { status: 'not_connected' })
  setSimulation('transcription', 'error')
  assert.equal((await fail(transcribeAudio('EXP-1042', { name: 'a.m4a' }))).status, 500)
})

test('persistencia local: lo guardado sobrevive a una recarga y se puede restablecer', async () => {
  const generated = await reports.generateReport('EXP-1311', {})
  const saved = await reports.saveReportDraft('EXP-1311', generated.id, toDraftPayload(edit(generated, 'Texto que debe sobrevivir')))
  const same = createPersistence(() => storage)
  setMockPersistence(same) // simula recargar la página: se pierde la memoria, queda el almacenamiento
  const after = await reports.getLatestReport('EXP-1311')
  assert.deepEqual([after.id, after.version, after.status], [saved.id, 2, 'draft'])
  assert.equal(after.sections[0].items[0].text, 'Texto que debe sobrevivir')
  assert.equal((await reports.listReportVersions(saved.id)).length, 2)
  resetMockReports()
  assert.equal(await reports.getLatestReport('EXP-1311'), null)
})

test('persistencia local: datos corruptos o de otra versión se ignoran y se vuelve a sembrar', async () => {
  storage.setItem('nuvia.sampleData', '{esto no es json')
  setMockPersistence(createPersistence(() => storage))
  assert.equal((await reports.getLatestReport('EXP-1203')).status, 'confirmed')
  storage.setItem('nuvia.sampleData', JSON.stringify({ schema: 1, state: { reports: {}, inputs: {} } }))
  setMockPersistence(createPersistence(() => storage))
  assert.equal((await reports.getLatestReport('EXP-1203')).status, 'confirmed')
})

test('persistencia local: sin almacenamiento disponible todo sigue funcionando en memoria', async () => {
  setMockPersistence(createPersistence(() => null))
  const generated = await reports.generateReport('EXP-1311', {})
  assert.equal((await reports.getLatestReport('EXP-1311')).id, generated.id)
})

test('la persistencia guarda solo lo necesario, sin claves ni datos del navegador', () => {
  const raw = storage.getItem('nuvia.sampleData')
  assert.ok(raw)
  const parsed = JSON.parse(raw)
  assert.equal(parsed.schema, 3)
  assert.deepEqual(Object.keys(parsed.state).sort(), ['counter', 'inputs', 'reports'])
})

test('estado de los servicios: por defecto datos de ejemplo con generador local', () => {
  const by = Object.fromEntries(getServiceStatuses().map((s) => [s.key, s]))
  assert.equal(by.reports.detail, 'Datos de ejemplo con generador local')
  assert.match(by.transcription.detail, /texto manual/)
  setSimulation('ai', 'error')
  assert.match(getServiceStatuses().find((s) => s.key === 'reports').detail, /^Simulación/)
})
