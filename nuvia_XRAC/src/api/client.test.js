import test from 'node:test'
import assert from 'node:assert/strict'
import { apiGet, apiRequest, buildUrl, ApiError, describeError } from './client.js'

const okResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body })

test('buildUrl omite parámetros vacíos y codifica el resto', () => {
  assert.equal(buildUrl('/api', '/patients', { q: 'ana lópez', limit: 5, x: '', y: null }), '/api/patients?q=ana+l%C3%B3pez&limit=5')
  assert.equal(buildUrl('http://h:8000/api', '/patients'), 'http://h:8000/api/patients')
})

test('apiGet devuelve el JSON cuando la respuesta es 2xx', async () => {
  const data = await apiGet('/p', { baseUrl: '/api', fetchImpl: async () => okResponse({ a: 1 }) })
  assert.deepEqual(data, { a: 1 })
})

test('apiGet usa la URL configurada y envía Accept: application/json', async () => {
  let seen
  await apiGet('/p', { baseUrl: 'http://backend:9/api', params: { q: 'x' }, fetchImpl: async (url, init) => { seen = { url, init }; return okResponse({}) } })
  assert.equal(seen.url, 'http://backend:9/api/p?q=x')
  assert.equal(seen.init.headers.Accept, 'application/json')
})

test('HTTP 404 y 500 => ApiError kind http con status', async () => {
  for (const status of [404, 500]) {
    await assert.rejects(apiGet('/p', { fetchImpl: async () => okResponse({}, status) }), (e) => e instanceof ApiError && e.kind === 'http' && e.status === status)
  }
})

test('JSON inválido => kind parse', async () => {
  await assert.rejects(apiGet('/p', { fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('x') } }) }), (e) => e.kind === 'parse')
})

test('fallo de red => kind network', async () => {
  await assert.rejects(apiGet('/p', { fetchImpl: async () => { throw new TypeError('Failed to fetch') } }), (e) => e.kind === 'network')
})

test('tiempo agotado => kind timeout', async () => {
  const hang = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' }))))
  await assert.rejects(apiGet('/p', { timeoutMs: 20, fetchImpl: hang }), (e) => e.kind === 'timeout')
})

test('cancelación por el llamador => kind aborted (no se reporta como error de red)', async () => {
  const hang = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' }))))
  const controller = new AbortController()
  const promise = apiGet('/p', { signal: controller.signal, timeoutMs: 5000, fetchImpl: hang })
  controller.abort()
  await assert.rejects(promise, (e) => e.kind === 'aborted')
})

test('describeError da un mensaje claro para cada tipo', () => {
  assert.match(describeError(new ApiError('x', { kind: 'network' }), '/api').detail, /\/api/)
  assert.match(describeError(new ApiError('x', { kind: 'http', status: 500 })).title, /error/i)
  assert.match(describeError(new ApiError('x', { kind: 'parse' })).title, /formato/i)
  assert.match(describeError(new ApiError('x', { kind: 'http', status: 500, simulated: true })).title, /simulado/i)
})

test('POST/PUT envían el cuerpo como JSON con Content-Type', async () => {
  let seen
  await apiRequest('/p', { method: 'PUT', body: { a: 1 }, fetchImpl: async (url, init) => { seen = init; return okResponse({}) } })
  assert.equal(seen.method, 'PUT')
  assert.equal(seen.headers['Content-Type'], 'application/json')
  assert.equal(seen.body, '{"a":1}')
})

test('multipart (FormData): no se fija Content-Type para que el navegador ponga el boundary', async () => {
  let seen
  const fd = new FormData()
  fd.append('patientId', 'P1')
  await apiRequest('/p', { method: 'POST', formData: fd, fetchImpl: async (url, init) => { seen = init; return okResponse({}) } })
  assert.equal(seen.headers['Content-Type'], undefined)
  assert.equal(seen.body, fd)
})

test('el código de negocio del backend ({error:{code}}) llega en el ApiError', async () => {
  const body = { error: { code: 'insufficient_information', message: 'Falta información' } }
  await assert.rejects(
    apiRequest('/p', { method: 'POST', body: {}, fetchImpl: async () => ({ ok: false, status: 422, json: async () => body }) }),
    (e) => e.status === 422 && e.code === 'insufficient_information' && e.message === 'Falta información'
  )
  await assert.rejects(apiRequest('/p', { fetchImpl: async () => ({ ok: false, status: 500, json: async () => { throw new Error('x') } }) }), (e) => e.status === 500 && e.code === null)
})

test('describeError cubre sesión expirada, sin permiso y respuesta de otro paciente', () => {
  assert.match(describeError(new ApiError('x', { kind: 'http', status: 401 })).title, /Sesión/)
  assert.match(describeError(new ApiError('x', { kind: 'http', status: 403 })).title, /permiso/)
  assert.match(describeError(new ApiError('x', { kind: 'mismatch' })).title, /otro|no corresponde/i)
})
