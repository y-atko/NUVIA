import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDisplayDate, formatDateTime } from './dateHelpers.js'
import { getRecentPatients, rememberPatient, clearRecentPatients } from './recentPatients.js'

test('formatDisplayDate reformatea solo fechas ISO válidas', () => {
  assert.equal(formatDisplayDate('2026-09-05'), '05/09/2026')
})

test('formatDisplayDate deja intacto cualquier otro formato o valor inválido', () => {
  assert.equal(formatDisplayDate('05/09/26'), '05/09/26')
  assert.equal(formatDisplayDate('2026-13-45'), '2026-13-45')
  assert.equal(formatDisplayDate('2026-02-30'), '2026-02-30')
  assert.equal(formatDisplayDate('ayer'), 'ayer')
  assert.equal(formatDisplayDate('2026-10-27T10:00:00Z'), '2026-10-27T10:00:00Z')
})

test('formatDisplayDate devuelve null para vacío o ausente', () => {
  for (const v of [null, undefined, '', '   ']) assert.equal(formatDisplayDate(v), null)
})

test('pacientes recientes: sin sessionStorage no falla', () => {
  assert.deepEqual(getRecentPatients(), [])
  assert.doesNotThrow(() => { rememberPatient({ id: 'a', label: 'A' }); clearRecentPatients() })
})

test('pacientes recientes: orden, sin duplicados y máximo 5', () => {
  const store = {}
  globalThis.sessionStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v }, removeItem: (k) => { delete store[k] } }
  try {
    ;['a', 'b', 'c', 'd', 'e', 'f', 'c'].forEach((id) => rememberPatient({ id, label: id.toUpperCase() }))
    assert.deepEqual(getRecentPatients().map((p) => p.id), ['c', 'f', 'e', 'd', 'b'])
    clearRecentPatients()
    assert.deepEqual(getRecentPatients(), [])
  } finally {
    delete globalThis.sessionStorage
  }
})

test('formatDateTime: marca de tiempo válida se muestra legible; lo demás tal cual o null', () => {
  assert.match(formatDateTime('2026-10-27T10:00:00Z'), /2026/)
  assert.notEqual(formatDateTime('2026-10-27T10:00:00Z'), '2026-10-27T10:00:00Z')
  assert.equal(formatDateTime('hoy por la tarde'), 'hoy por la tarde')
  assert.equal(formatDateTime('05/09/26'), '05/09/26')
  assert.equal(formatDateTime(null), null)
  assert.equal(formatDateTime('  '), null)
})

test('isSamePatientPath: mismas pestañas del paciente sí; otro paciente con prefijo parecido no', async () => {
  const { isSamePatientPath } = await import('./paths.js')
  assert.equal(isSamePatientPath('/dashboard/pacientes/TEST-001', 'TEST-001'), true)
  assert.equal(isSamePatientPath('/dashboard/pacientes/TEST-001/consulta', 'TEST-001'), true)
  assert.equal(isSamePatientPath('/dashboard/pacientes/TEST-0011', 'TEST-001'), false)
  assert.equal(isSamePatientPath('/dashboard/pacientes', 'TEST-001'), false)
  assert.equal(isSamePatientPath('/dashboard/pacientes/a%20b/consulta', 'a b'), true)
})

test('saludo según la hora y fecha larga en español', async () => {
  const { greetingFor, longDate, initialsOf } = await import('./greeting.js')
  assert.equal(greetingFor(new Date(2026, 10, 3, 8)), 'Buenos días')
  assert.equal(greetingFor(new Date(2026, 10, 3, 12)), 'Buenas tardes')
  assert.equal(greetingFor(new Date(2026, 10, 3, 19)), 'Buenas noches')
  assert.match(longDate(new Date(2026, 10, 3)), /^Martes, 3 de noviembre/)
  assert.equal(initialsOf('Ana Lucía Treviño Garza'), 'AL')
  assert.equal(initialsOf('  luis '), 'L')
  assert.equal(initialsOf(''), '?')
})
