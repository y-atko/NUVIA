import test from 'node:test'
import assert from 'node:assert/strict'
import { listPatients, getPatientRecord, setScenario, setMockLatency } from './mockApi.js'
import { MOCK_PATIENTS } from './mockData.js'
import { normalizeRecord, normalizeListResponse } from '../normalize.js'

setMockLatency(0)
const load = async (id) => normalizeRecord(await getPatientRecord(id), id)

test.beforeEach(() => setScenario('normal'))

test('hay 8 expedientes de ejemplo y cada paciente de la lista tiene el suyo', async () => {
  assert.equal(MOCK_PATIENTS.length, 8)
  for (const p of MOCK_PATIENTS) {
    const rec = await load(p.id)
    assert.equal(rec.patient.id, p.id)
    assert.equal(rec.patient.label, p.label)
  }
})

test('EXP-1042: completo, todas las afirmaciones respaldadas por una fuente existente', async () => {
  const rec = await load('EXP-1042')
  assert.ok(rec.counts.claims >= 10)
  assert.equal(rec.counts.unverifiedClaims, 0)
  assert.ok(rec.records.length > 0)
  assert.equal(rec.patient.details.length, 2)
})

test('los expedientes completos cubren las secciones que el profesional espera encontrar', async () => {
  const keys = (await load('EXP-1042')).sections.map((s) => s.key)
  for (const k of ['motivo', 'antecedentes', 'historial', 'consultas', 'estudios', 'medicamentos', 'signos']) assert.ok(keys.includes(k), k)
})

test('EXP-1187: incompleto, con secciones vacías y alertas de información no documentada', async () => {
  const rec = await load('EXP-1187')
  assert.ok(rec.counts.missing >= 3)
  assert.ok(rec.sections.some((s) => s.items.length === 0))
  assert.equal(rec.counts.contradiction, 0)
})

test('EXP-1203: contradicciones, y un cambio de valores que solo se marca "por revisar"', async () => {
  const rec = await load('EXP-1203')
  assert.equal(rec.counts.contradiction, 2)
  assert.equal(rec.alerts.find((a) => a.id === 'c-al3').type, 'review')
})

test('EXP-1311: afirmaciones sin fuente verificable, incluida una referencia inexistente', async () => {
  const rec = await load('EXP-1311')
  assert.equal(rec.counts.unverifiedClaims, 3)
  assert.ok(rec.sections.flatMap((s) => s.items).some((i) => i.unresolvedSourceIds.includes('d-s99')))
})

test('EXP-1355: expediente sin información', async () => {
  assert.equal((await load('EXP-1355')).isEmpty, true)
})

test('las alertas solo citan fuentes y afirmaciones que existen', async () => {
  for (const p of MOCK_PATIENTS) {
    const rec = await load(p.id)
    const claimIds = new Set(rec.sections.flatMap((s) => s.items.map((i) => i.id)))
    for (const alert of rec.alerts) {
      assert.deepEqual(alert.unresolvedSourceIds, [], `${p.id}/${alert.id}: fuente inexistente`)
      alert.claimIds.forEach((id) => assert.ok(claimIds.has(id), `${p.id}/${alert.id}: afirmación ${id} inexistente`))
    }
  }
})

test('búsqueda por nombre o identificador, sin distinguir mayúsculas ni acentos escritos igual', async () => {
  assert.equal(normalizeListResponse(await listPatients({ q: 'treviño' })).items[0].id, 'EXP-1042')
  assert.equal(normalizeListResponse(await listPatients({ q: 'exp-1203' })).items[0].id, 'EXP-1203')
  assert.equal(normalizeListResponse(await listPatients({ q: 'no existe' })).items.length, 0)
})

test('paciente inexistente => 404', async () => {
  await assert.rejects(getPatientRecord('NOPE'), (e) => e.kind === 'http' && e.status === 404)
})

test('escenario "error" hace fallar listado y expediente', async () => {
  setScenario('error')
  await assert.rejects(listPatients(), (e) => e.status === 500 && e.simulated)
  await assert.rejects(getPatientRecord('EXP-1042'), (e) => e.status === 500)
})

test('escenario "empty": listado vacío y expedientes vacíos', async () => {
  setScenario('empty')
  assert.deepEqual(normalizeListResponse(await listPatients()), { items: [], total: 0 })
  assert.equal((await load('EXP-1042')).isEmpty, true)
})

test('cancelar una consulta en curso la rechaza con kind aborted', async () => {
  setMockLatency(50)
  const controller = new AbortController()
  const promise = listPatients({ signal: controller.signal })
  controller.abort()
  await assert.rejects(promise, (e) => e.kind === 'aborted')
  setMockLatency(0)
})

test('los datos devueltos son copias: modificarlos no altera los datos de ejemplo', async () => {
  const a = await getPatientRecord('EXP-1042')
  a.summary.sections[0].items[0].text = 'ALTERADO'
  const b = await getPatientRecord('EXP-1042')
  assert.notEqual(b.summary.sections[0].items[0].text, 'ALTERADO')
})
