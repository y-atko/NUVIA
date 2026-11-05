import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRecord, normalizeListResponse, findRecordForSource } from './normalize.js'

const base = (over = {}) => ({
  patient: { id: 'P1', label: 'Paciente' },
  summary: { sections: [] },
  alerts: [],
  sources: [],
  records: [],
  ...over
})

const oneItem = (item, sources = []) =>
  normalizeRecord(base({ summary: { sections: [{ key: 's', title: 'S', items: [item] }] }, sources }))
    .sections[0].items[0]

test('afirmación con fuente existente y estado documented se muestra respaldada', () => {
  const item = oneItem({ id: 'c1', text: 'Dato', status: 'documented', sourceIds: ['s1'] }, [
    { id: 's1', table: 'T', recordId: 'R1' }
  ])
  assert.equal(item.displayStatus, 'documented')
  assert.equal(item.sources.length, 1)
})

test('afirmación "documented" SIN fuentes NO se muestra como respaldada', () => {
  const item = oneItem({ id: 'c1', text: 'Dato', status: 'documented', sourceIds: [] })
  assert.equal(item.displayStatus, 'unverified')
})

test('referencia a fuente inexistente => sin fuente verificable y se conserva el id no encontrado', () => {
  const item = oneItem({ id: 'c1', text: 'Dato', status: 'documented', sourceIds: ['zzz'] })
  assert.equal(item.displayStatus, 'unverified')
  assert.deepEqual(item.unresolvedSourceIds, ['zzz'])
})

test('referencias parcialmente resueltas: sigue verificada y reporta la que falta', () => {
  const item = oneItem({ id: 'c1', text: 'Dato', status: 'documented', sourceIds: ['s1', 'zzz'] }, [
    { id: 's1', table: 'T', recordId: 'R1' }
  ])
  assert.equal(item.displayStatus, 'documented')
  assert.deepEqual(item.unresolvedSourceIds, ['zzz'])
})

test('estado desconocido o ausente se trata como "por revisar", nunca como respaldado', () => {
  const sources = [{ id: 's1', table: 'T', recordId: 'R1' }]
  assert.equal(oneItem({ id: 'a', text: 'x', status: 'raro', sourceIds: ['s1'] }, sources).displayStatus, 'needs_review')
  assert.equal(oneItem({ id: 'b', text: 'x', sourceIds: ['s1'] }, sources).displayStatus, 'needs_review')
})

test('fuentes sin id se descartan y fuentes duplicadas no rompen nada', () => {
  const rec = normalizeRecord(
    base({ sources: [{ table: 'T' }, { id: 's1', table: 'A' }, { id: 's1', table: 'B' }], summary: { sections: [{ key: 's', items: [{ id: 'c', text: 'x', status: 'documented', sourceIds: ['s1'] }] }] } })
  )
  assert.equal(rec.sections[0].items[0].sources[0].table, 'A')
})

test('alerta con tipo desconocido se conserva como "review" (no se oculta)', () => {
  const rec = normalizeRecord(base({ alerts: [{ id: 'a1', type: 'grave', title: 'T' }] }))
  assert.equal(rec.alerts[0].type, 'review')
})

test('conteos por tipo de alerta y afirmaciones sin fuente', () => {
  const rec = normalizeRecord(
    base({
      alerts: [{ type: 'contradiction' }, { type: 'contradiction' }, { type: 'missing' }, { type: 'review' }],
      summary: { sections: [{ key: 's', items: [{ text: 'a', sourceIds: [] }, { text: 'b', sourceIds: ['s1'], status: 'documented' }] }] },
      sources: [{ id: 's1' }]
    })
  )
  assert.deepEqual(
    { c: rec.counts.contradiction, r: rec.counts.review, m: rec.counts.missing, u: rec.counts.unverifiedClaims, n: rec.counts.claims },
    { c: 2, r: 1, m: 1, u: 1, n: 2 }
  )
})

test('respuestas malformadas no lanzan errores y se consideran vacías', () => {
  for (const raw of [null, undefined, 42, 'texto', [], {}, { summary: 'x', alerts: 'x', sources: 3, records: {} }]) {
    const rec = normalizeRecord(raw, 'P9')
    assert.equal(rec.isEmpty, true)
    assert.equal(rec.patient.id, 'P9')
    assert.equal(rec.patient.label, 'P9')
  }
})

test('un expediente con solo alertas o solo registros NO es "vacío"', () => {
  assert.equal(normalizeRecord(base({ alerts: [{ type: 'missing', title: 'x' }] })).isEmpty, false)
  assert.equal(normalizeRecord(base({ records: [{ table: 'T', recordId: '1', fields: { A: 'b' } }] })).isEmpty, false)
})

test('campos vacíos de un registro se conservan como cadena vacía (no se inventan valores)', () => {
  const rec = normalizeRecord(base({ records: [{ table: 'T', recordId: '1', fields: { A: '', B: null, C: 0 } }] }))
  assert.deepEqual(rec.records[0].fields, [
    { label: 'A', value: '' },
    { label: 'B', value: '' },
    { label: 'C', value: '0' }
  ])
})

test('las fechas se conservan tal como llegan', () => {
  const item = oneItem({ id: 'c', text: 'x', date: '05/09/26', sourceIds: [] })
  assert.equal(item.date, '05/09/26')
})

test('lista: total solo si el backend lo envía; items sin id se descartan', () => {
  assert.equal(normalizeListResponse({ items: [{ id: 'a' }] }).total, null)
  assert.equal(normalizeListResponse({ items: [{ id: 'a' }], total: 7 }).total, 7)
  assert.equal(normalizeListResponse({ items: [{ label: 'sin id' }, { id: 'b' }] }).items.length, 1)
  assert.deepEqual(normalizeListResponse(undefined), { items: [], total: null })
  assert.equal(normalizeListResponse([{ id: 'x', label: 'X' }]).items[0].label, 'X')
})

test('findRecordForSource empata por tabla y registro', () => {
  const records = [{ table: 'T', recordId: '1', fields: [] }, { table: 'T', recordId: '2', fields: [] }]
  assert.equal(findRecordForSource(records, { table: 'T', recordId: '2' }), records[1])
  assert.equal(findRecordForSource(records, { table: 'T', recordId: '3' }), null)
  assert.equal(findRecordForSource(records, { table: null, recordId: '1' }), null)
})

test('datos generales del paciente (details): solo pares con etiqueta y valor', () => {
  const rec = normalizeRecord(base({ patient: { id: 'P1', details: [{ label: 'Servicio', value: 'Medicina interna' }, { label: 'Vacío', value: '' }, 'x', null] } }))
  assert.deepEqual(rec.patient.details, [{ label: 'Servicio', value: 'Medicina interna' }])
  assert.deepEqual(normalizeRecord(base()).patient.details, [])
})
