import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeReport } from '../api/normalizeReport.js'
import {
  createEditorState, editorReducer, isDirty, toDraftPayload, findEmptyItems, getAvailableActions
} from './reportEditor.js'

const raw = (over = {}) => ({
  id: 'r1', patientId: 'P1', status: 'generated', version: 1, generatedVersion: 1, observations: '',
  sources: [{ id: 's1', table: 'T', recordId: '1' }],
  sections: [
    { key: 'summary', title: 'Resumen', items: [
      { id: 'i1', text: 'Texto IA uno', status: 'documented', sourceIds: ['s1'] },
      { id: 'i2', text: 'Texto IA dos', status: 'documented', sourceIds: ['s1'] }
    ] },
    { key: 'review', title: 'Revisión', items: [] }
  ],
  ...over
})
const load = (over) => createEditorState(normalizeReport(raw(over), 'P1'))
const edit = (s, id, text) => editorReducer(s, { type: 'editItem', sectionKey: 'summary', itemId: id, text })
const item = (s, id) => s.sections[0].items.find((i) => i.id === id)

test('un reporte recién cargado no tiene cambios', () => {
  assert.equal(isDirty(load()), false)
})

test('editar texto de IA: marca "editado", conserva el original y queda con cambios', () => {
  const s = edit(load(), 'i1', 'Texto corregido')
  assert.equal(item(s, 'i1').edited, true)
  assert.equal(item(s, 'i1').originalText, 'Texto IA uno')
  assert.equal(item(s, 'i1').authorship, 'ai')
  assert.equal(isDirty(s), true)
})

test('editar dos veces conserva el PRIMER original; volver al original quita "editado" y los cambios', () => {
  let s = edit(load(), 'i1', 'Primera')
  s = edit(s, 'i1', 'Segunda')
  assert.equal(item(s, 'i1').originalText, 'Texto IA uno')
  s = edit(s, 'i1', 'Texto IA uno')
  assert.equal(item(s, 'i1').edited, false)
  assert.equal(isDirty(s), false)
})

test('el estado base (lo que tiene el backend) nunca se modifica al editar', () => {
  const s0 = load()
  const before = JSON.stringify(s0.base)
  let s = edit(s0, 'i1', 'X')
  s = editorReducer(s, { type: 'addItem', sectionKey: 'review', text: 'Nuevo' })
  s = editorReducer(s, { type: 'removeItem', sectionKey: 'summary', itemId: 'i2' })
  assert.equal(JSON.stringify(s.base), before)
})

test('agregar: crea un elemento del profesional con id local y sin fuentes; texto vacío se ignora', () => {
  let s = editorReducer(load(), { type: 'addItem', sectionKey: 'review', text: '  Dato del profesional  ' })
  const added = s.sections[1].items[0]
  assert.equal(added.text, 'Dato del profesional')
  assert.equal(added.authorship, 'professional')
  assert.match(added.id, /^local-/)
  assert.deepEqual(added.sourceIds, [])
  assert.equal(added.displayStatus, 'professional')
  const same = editorReducer(s, { type: 'addItem', sectionKey: 'review', text: '   ' })
  assert.equal(same, s)
  s = editorReducer(s, { type: 'addItem', sectionKey: 'review', text: 'Otro' })
  assert.notEqual(s.sections[1].items[0].id, s.sections[1].items[1].id)
})

test('eliminar y descartar: descartar vuelve exactamente a la versión del backend', () => {
  let s = editorReducer(load(), { type: 'removeItem', sectionKey: 'summary', itemId: 'i2' })
  s = editorReducer(s, { type: 'setObservations', text: 'Obs' })
  assert.equal(isDirty(s), true)
  s = editorReducer(s, { type: 'discard' })
  assert.equal(isDirty(s), false)
  assert.equal(s.sections[0].items.length, 2)
  assert.equal(s.observations, '')
})

test('observaciones: cambiarlas y revertirlas', () => {
  let s = editorReducer(load(), { type: 'setObservations', text: 'Algo' })
  assert.equal(isDirty(s), true)
  s = editorReducer(s, { type: 'setObservations', text: '' })
  assert.equal(isDirty(s), false)
})

test('replaceContent (restaurar versión IA) cambia el buffer pero NO la base', () => {
  const s0 = edit(load(), 'i1', 'Editado')
  const ai = normalizeReport(raw(), 'P1')
  const s = editorReducer(s0, { type: 'replaceContent', report: ai })
  assert.equal(item(s, 'i1').text, 'Texto IA uno')
  assert.equal(s.base, s0.base)
})

test('payload de borrador: versión base, ids locales y originalText solo si está editado', () => {
  let s = edit(load(), 'i1', 'Cambio')
  s = editorReducer(s, { type: 'addItem', sectionKey: 'review', text: 'Nuevo' })
  const p = toDraftPayload(s)
  assert.equal(p.baseVersion, 1)
  const [a, b] = p.sections[0].items
  assert.deepEqual([a.edited, a.originalText, a.sourceIds], [true, 'Texto IA uno', ['s1']])
  assert.deepEqual([b.edited, b.originalText], [false, null])
  assert.match(p.sections[1].items[0].id, /^local-/)
  assert.equal(p.sections[1].items[0].authorship, 'professional')
})

test('se detectan elementos con texto vacío (no se pueden guardar)', () => {
  const s = edit(load(), 'i1', '   ')
  assert.deepEqual(findEmptyItems(s), [{ sectionKey: 'summary', itemId: 'i1' }])
})

test('acciones permitidas según estado: confirmado es de solo lectura', () => {
  const a = getAvailableActions({ status: 'confirmed', dirty: true, editing: true, hasAiVersion: true })
  assert.equal(Object.values(a).every((v) => v === false), true)
})

test('acciones permitidas: generado limpio / borrador con cambios', () => {
  const clean = getAvailableActions({ status: 'generated', dirty: false, editing: false, hasAiVersion: true })
  assert.equal(clean.canEdit, true)
  assert.equal(clean.canSave, false)
  assert.equal(clean.canRestoreAi, false)
  assert.equal(clean.canConfirm, true)
  const draft = getAvailableActions({ status: 'draft', dirty: true, editing: true, hasAiVersion: true })
  assert.equal(draft.canEdit, false)
  assert.equal(draft.canStopEditing, true)
  assert.equal(draft.canSave && draft.canDiscard && draft.canRestoreAi, true)
  assert.equal(getAvailableActions({ status: 'draft', dirty: false, editing: false, hasAiVersion: false }).canRestoreAi, false)
})

test('en revisión: se puede confirmar o seguir editando, pero no volver a enviar a revisión', () => {
  const a = getAvailableActions({ status: 'in_review', dirty: false, editing: false, hasAiVersion: true })
  assert.equal(a.canSubmitReview, false)
  assert.equal(a.canConfirm, true)
  assert.equal(a.canEdit, true)
})

test('borrador y generado: se pueden enviar a revisión', () => {
  for (const status of ['generated', 'draft']) {
    assert.equal(getAvailableActions({ status, dirty: false, editing: false, hasAiVersion: true }).canSubmitReview, true)
  }
})
