// Prueba la ruta REAL (DATA_SOURCE='api') contra un servidor HTTP local que imita al backend.
// No usa el mock: valida URL, parámetros, normalización y errores de punta a punta.
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { MOCK_PATIENTS, MOCK_RECORDS } from './mock/mockData.js'

let server
let api // módulo patientsApi cargado DESPUÉS de fijar la configuración
let hits = []

before(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    hits.push(req.url)
    const send = (status, body, type = 'application/json') => {
      res.writeHead(status, { 'Content-Type': type })
      res.end(typeof body === 'string' ? body : JSON.stringify(body))
    }
    if (url.pathname === '/api/patients') {
      const q = (url.searchParams.get('q') || '').toLowerCase()
      return send(200, { items: MOCK_PATIENTS.filter((p) => p.id.toLowerCase().includes(q)), total: MOCK_PATIENTS.length })
    }
    const m = url.pathname.match(/^\/api\/patients\/([^/]+)\/record$/)
    if (m) {
      const id = decodeURIComponent(m[1])
      if (id === 'BOOM') return send(500, { detail: 'fallo interno' })
      if (id === 'BADJSON') return send(200, '<html>no es json</html>', 'text/html')
      return MOCK_RECORDS[id] ? send(200, MOCK_RECORDS[id]) : send(404, { detail: 'no existe' })
    }
    send(404, {})
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  globalThis.window = { __NUVIA_CONFIG__: { DATA_SOURCE: 'api', API_BASE_URL: `http://127.0.0.1:${port}/api/` } }
  api = await import('./patientsApi.js')
})

after(() => new Promise((resolve) => server.close(resolve)))

test('listPatients llama a /patients con q y limit y normaliza la respuesta', async () => {
  hits = []
  const { items, total } = await api.listPatients({ q: 'EXP-', limit: 3 })
  assert.equal(hits[0], '/api/patients?q=EXP-&limit=3') // la "/" final de la URL base se ignora
  assert.equal(items.length, 8)
  assert.equal(total, 8)
})

test('getPatientRecord llama a /patients/:id/record y normaliza (fuentes resueltas)', async () => {
  hits = []
  const rec = await api.getPatientRecord('EXP-1203')
  assert.equal(hits[0], '/api/patients/EXP-1203/record')
  assert.equal(rec.counts.contradiction, 2)
  assert.equal(rec.counts.unverifiedClaims, 0)
})

test('el id del paciente se codifica en la URL', async () => {
  hits = []
  await assert.rejects(api.getPatientRecord('a b/c'), (e) => e.status === 404)
  assert.equal(hits[0], '/api/patients/a%20b%2Fc/record')
})

test('404, 500 y respuesta que no es JSON se convierten en ApiError con su tipo', async () => {
  await assert.rejects(api.getPatientRecord('NOPE'), (e) => e.kind === 'http' && e.status === 404)
  await assert.rejects(api.getPatientRecord('BOOM'), (e) => e.kind === 'http' && e.status === 500)
  await assert.rejects(api.getPatientRecord('BADJSON'), (e) => e.kind === 'parse')
})

test('checkConnection informa éxito con el origen "api"', async () => {
  const result = await api.checkConnection()
  assert.equal(result.ok, true)
  assert.equal(result.source, 'api')
})

test('con el backend caído el error es de red', async () => {
  await new Promise((resolve) => server.close(resolve))
  await assert.rejects(api.listPatients(), (e) => e.kind === 'network')
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)) // para que after() cierre sin error
})
