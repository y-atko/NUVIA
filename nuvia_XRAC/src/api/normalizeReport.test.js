import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeReport, normalizeReportList, normalizeVersionList, normalizeSubmittedInputs, normalizeTranscription } from './normalizeReport.js'

const base = (over = {}) => ({ id: 'r1', patientId: 'P1', status: 'draft', version: 2, generatedVersion: 1, sections: [], sources: [], ...over })
const withItem = (item, sources = []) => normalizeReport(base({ sections: [{ key: 's', title: 'S', items: [item] }], sources }), 'P1').sections[0].items[0]

test('seguridad: un reporte de otro paciente, o sin patientId, se rechaza', () => {
  assert.throws(() => normalizeReport(base({ patientId: 'P2' }), 'P1'), (e) => e.kind === 'mismatch')
  assert.throws(() => normalizeReport(base({ patientId: undefined }), 'P1'), (e) => e.kind === 'mismatch')
  assert.equal(normalizeReport(base(), 'P1').patientId, 'P1')
})

test('sin reporte: { report: null } y null devuelven null', () => {
  assert.equal(normalizeReport({ report: null }, 'P1'), null)
  assert.equal(normalizeReport(null, 'P1'), null)
})

test('un reporte sin id es un error de formato', () => {
  assert.throws(() => normalizeReport(base({ id: '' }), 'P1'), (e) => e.kind === 'parse')
})

test('estado desconocido => borrador (editable, nunca aprobado); solo "confirmed" exacto aprueba', () => {
  assert.equal(normalizeReport(base({ status: 'approved' }), 'P1').status, 'draft')
  assert.equal(normalizeReport(base({ status: 'CONFIRMED' }), 'P1').status, 'draft')
  assert.equal(normalizeReport(base({ status: 'confirmed' }), 'P1').status, 'confirmed')
})

test('estado de las afirmaciones: respaldada / por revisar / sin fuente / ausencia / del profesional', () => {
  const s = [{ id: 's1', table: 'T', recordId: '1' }]
  assert.equal(withItem({ id: 'a', text: 'x', status: 'documented', sourceIds: ['s1'] }, s).displayStatus, 'documented')
  assert.equal(withItem({ id: 'a', text: 'x', status: 'needs_review', sourceIds: ['s1'] }, s).displayStatus, 'needs_review')
  assert.equal(withItem({ id: 'a', text: 'x', status: 'documented', sourceIds: [] }).displayStatus, 'unverified')
  assert.equal(withItem({ id: 'a', text: 'x', status: 'documented', sourceIds: ['zzz'] }).displayStatus, 'unverified')
  assert.equal(withItem({ id: 'a', text: 'x', kind: 'absence', sourceIds: [] }).displayStatus, 'missing')
  assert.equal(withItem({ id: 'a', text: 'x', authorship: 'professional' }).displayStatus, 'professional')
})

test('un texto de IA sin fuente NO se hace pasar por aportado por el profesional', () => {
  assert.equal(withItem({ id: 'a', text: 'x', authorship: 'ai' }).displayStatus, 'unverified')
  assert.equal(withItem({ id: 'a', text: 'x', authorship: 'raro' }).authorship, 'ai')
})

test('se conservan los ids de fuente no resueltos para reenviarlos al guardar', () => {
  const it = withItem({ id: 'a', text: 'x', sourceIds: ['s1', 'zzz'] }, [{ id: 's1' }])
  assert.deepEqual(it.sourceIds, ['s1', 'zzz'])
  assert.deepEqual(it.unresolvedSourceIds, ['zzz'])
})

test('"editado" solo aplica a texto de IA y conserva el original', () => {
  const ai = withItem({ id: 'a', text: 'nuevo', edited: true, originalText: 'viejo', authorship: 'ai' })
  assert.deepEqual([ai.edited, ai.originalText], [true, 'viejo'])
  const pro = withItem({ id: 'a', text: 'x', edited: true, originalText: 'y', authorship: 'professional' })
  assert.deepEqual([pro.edited, pro.originalText], [false, null])
})

test('tipos de fuente: record, input y transcription; desconocido => record', () => {
  const r = normalizeReport(base({ sources: [{ id: 'a', kind: 'input' }, { id: 'b', kind: 'transcription' }, { id: 'c', kind: 'otro' }, { id: 'd' }] }), 'P1')
  assert.deepEqual(r.sources.map((s) => s.kind), ['input', 'transcription', 'record', 'record'])
})

test('respuestas malformadas dentro del reporte no lanzan errores', () => {
  const r = normalizeReport(base({ sections: 'x', sources: 3, notices: 'x', generatedBy: 'x' }), 'P1')
  assert.deepEqual([r.sections, r.sources, r.notices, r.generatedBy], [[], [], [], null])
})

test('historial: ordena de la más reciente a la más antigua y descarta entradas sin versión', () => {
  const v = normalizeVersionList({ items: [{ version: 1, status: 'generated' }, { version: 3, status: 'confirmed' }, { status: 'draft' }, { version: 2, status: 'x' }] })
  assert.deepEqual(v.map((e) => [e.version, e.status]), [[3, 'confirmed'], [2, 'draft'], [1, 'generated']])
})

test('información adicional enviada: exige ids; ids ausentes es error de formato', () => {
  assert.equal(normalizeSubmittedInputs({ items: [{ id: 'i1', kind: 'transcription', text: 'x' }] })[0].kind, 'transcription')
  assert.throws(() => normalizeSubmittedInputs({ items: [{ text: 'sin id' }] }), (e) => e.kind === 'parse')
  assert.deepEqual(normalizeSubmittedInputs({ items: [] }), [])
})

test('transcripción: nunca se fabrica texto; sin texto es un error', () => {
  assert.throws(() => normalizeTranscription({}), (e) => e.kind === 'parse')
  assert.throws(() => normalizeTranscription(null), (e) => e.kind === 'parse')
  assert.equal(normalizeTranscription({ text: '', isSynthetic: true }).isSynthetic, true)
  assert.equal(normalizeTranscription({ text: 'hola' }).isSynthetic, false)
})

test('"in_review" es un estado válido; el listado nunca confunde un estado desconocido con confirmado', () => {
  assert.equal(normalizeReport(base({ status: 'in_review' }), 'P1').status, 'in_review')
  const list = normalizeReportList({ items: [{ id: 'r1', patientId: 'P1', status: 'aprobado', updatedAt: '2026-01-01' }] })
  assert.equal(list.items[0].status, 'draft')
})

test('listado de reportes: ordena por fecha, descarta incompletos, usa el id si falta el nombre y calcula el total', () => {
  const list = normalizeReportList({ items: [
    { id: 'a', patientId: 'P1', patientLabel: 'Ana', status: 'confirmed', updatedAt: '2026-01-01T00:00:00Z', version: 3 },
    { id: 'b', patientId: 'P2', status: 'draft', updatedAt: '2026-02-01T00:00:00Z' },
    { id: 'c' }, { patientId: 'P3' }, null
  ] })
  assert.deepEqual(list.items.map((i) => i.id), ['b', 'a'])
  assert.equal(list.items[0].patientLabel, 'P2')
  assert.equal(list.total, 2)
  assert.deepEqual(normalizeReportList(undefined), { items: [], total: 0 })
  assert.equal(normalizeReportList({ items: [], total: 9 }).total, 9)
})
