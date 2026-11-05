import test from 'node:test'
import assert from 'node:assert/strict'
import { stageOf, stageLabel, isPending } from './reportStatus.js'

test('los cuatro estados del backend se agrupan en Borrador, En revisión y Confirmado', () => {
  assert.deepEqual(['generated', 'draft', 'in_review', 'confirmed'].map(stageLabel), ['Borrador', 'Borrador', 'En revisión', 'Confirmado'])
})

test('un estado desconocido nunca cuenta como confirmado', () => {
  assert.equal(stageOf('aprobado'), 'draft')
  assert.equal(stageOf(undefined), 'draft')
  assert.equal(isPending('aprobado'), true)
})

test('pendiente de revisión = todo lo que no está confirmado', () => {
  assert.deepEqual(['generated', 'draft', 'in_review', 'confirmed'].map(isPending), [true, true, true, false])
})
