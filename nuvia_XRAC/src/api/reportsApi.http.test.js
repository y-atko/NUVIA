// Prueba la ruta REAL de reportes, información adicional y transcripción (fuentes en 'api')
// contra un servidor HTTP local que imita al backend. No usa el mock.
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

let server
let reports, consultation, transcription
const seen = [] // peticiones recibidas: { method, url, type, body }

const report = (over = {}) => ({
  id: 'r1', patientId: 'P1', status: 'generated', version: 1, generatedVersion: 1, isTestData: true,
  sections: [{ key: 'summary', title: 'Resumen', items: [{ id: 'i1', text: 'Dato', status: 'documented', sourceIds: ['s1'] }] }],
  sources: [{ id: 's1', table: 'T', recordId: '1' }], ...over
})

before(async () => {
  server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      const url = new URL(req.url, 'http://x')
      seen.push({ method: req.method, url: req.url, type: req.headers['content-type'] || '', body: raw })
      const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)) }
      const p = url.pathname

      let m = p.match(/^\/api\/patients\/([^/]+)\/(consultation-inputs|reports\/latest|reports)$/)
      if (m) {
        const [, pid, what] = m
        if (what === 'consultation-inputs') {
          const { inputs } = JSON.parse(raw)
          return send(201, { items: inputs.map((x, i) => ({ id: `inp-${i + 1}`, kind: x.kind, label: x.label, text: x.text })) })
        }
        if (what === 'reports/latest') return pid === 'P9' ? send(200, { report: report({ patientId: 'OTRO' }) }) : send(200, { report: null })
        if (pid === 'P-501') return send(501, { error: { code: 'not_implemented', message: 'Aún no' } })
        if (pid === 'P-503') return send(503, {})
        if (pid === 'P-422') return send(422, { error: { code: 'insufficient_information', message: 'Falta información' } })
        return send(201, { report: report({ patientId: pid }) })
      }
      if (p === '/api/reports') {
        if (url.searchParams.get('limit') === '7') return send(501, {})
        return send(200, { items: [
          { id: 'r1', patientId: 'P1', patientLabel: 'Paciente Uno', status: 'in_review', version: 3, updatedAt: '2026-11-01T10:00:00Z' },
          { id: 'r2', patientId: 'P2', status: 'confirmed', version: 2, updatedAt: '2026-11-02T10:00:00Z', confirmedBy: 'Dra. X' }
        ], total: 2 })
      }
      m = p.match(/^\/api\/reports\/([^/]+)\/(draft|confirm|review|versions)(?:\/(\d+))?$/)
      if (m) {
        const [, , action, n] = m
        if (action === 'draft') return send(200, { report: report({ status: 'draft', version: JSON.parse(raw).baseVersion + 1 }) })
        if (action === 'review') return send(200, { report: report({ status: 'in_review', version: JSON.parse(raw).version + 1 }) })
        if (action === 'confirm') return send(200, { report: report({ status: 'confirmed', version: JSON.parse(raw).version + 1, confirmedAt: '2026-11-01T00:00:00Z', confirmedBy: 'Dra. X' }) })
        if (n) return send(200, { report: report({ version: Number(n) }) })
        return send(200, { items: [{ version: 1, status: 'generated' }, { version: 2, status: 'draft' }] })
      }
      if (p === '/api/transcriptions') {
        if (raw.includes('P-501')) return send(501, {})
        return send(200, { text: 'hola mundo', language: 'es', provider: 'proveedor-x' })
      }
      send(404, {})
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  globalThis.window = { __NUVIA_CONFIG__: { DATA_SOURCE: 'api', API_BASE_URL: `http://127.0.0.1:${port}/api` } }
  reports = await import('./reportsApi.js')
  consultation = await import('./consultationApi.js')
  transcription = await import('./transcriptionApi.js')
})
after(() => new Promise((resolve) => server.close(resolve)))
const last = () => seen.at(-1)

test('sin reporte previo: { report: null } => null', async () => {
  assert.equal(await reports.getLatestReport('P1'), null)
  assert.equal(last().url, '/api/patients/P1/reports/latest')
})

test('información adicional: POST con { inputs } y devuelve los ids asignados por el backend', async () => {
  const out = await consultation.submitConsultationInputs('P1', [{ kind: 'input', label: 'L', text: 'a' }, { kind: 'transcription', label: 'T', text: 'b' }])
  assert.deepEqual(out.map((o) => [o.id, o.kind]), [['inp-1', 'input'], ['inp-2', 'transcription']])
  assert.equal(last().method, 'POST')
  assert.match(last().type, /application\/json/)
  assert.equal(JSON.parse(last().body).inputs.length, 2)
})

test('sin información adicional no se hace ninguna petición', async () => {
  const before = seen.length
  assert.deepEqual(await consultation.submitConsultationInputs('P1', []), [])
  assert.equal(seen.length, before)
})

test('generar: POST /patients/:id/reports solo con ids de información (no reenvía el expediente)', async () => {
  const r = await reports.generateReport('P1', { inputIds: ['inp-1'], recordGeneratedAt: '2026-10-27T10:00:00Z' })
  assert.equal(r.status, 'generated')
  assert.equal(last().method, 'POST')
  assert.equal(last().url, '/api/patients/P1/reports')
  assert.deepEqual(JSON.parse(last().body), { inputIds: ['inp-1'], recordGeneratedAt: '2026-10-27T10:00:00Z' })
})

test('generar: 501, 503 y 422 se clasifican como no conectado, no disponible e insuficiente', async () => {
  const code = async (pid) => reports.classifyGenerationFailure(await reports.generateReport(pid, {}).then(() => null, (e) => e)).code
  assert.equal(await code('P-501'), 'not_connected')
  assert.equal(await code('P-503'), 'unavailable')
  assert.equal(await code('P-422'), 'insufficient')
})

test('guardar borrador: PUT /reports/:id/draft con la versión base', async () => {
  const r = await reports.saveReportDraft('P1', 'r1', { baseVersion: 1, observations: '', sections: [] })
  assert.deepEqual([r.status, r.version], ['draft', 2])
  assert.equal(last().method, 'PUT')
  assert.equal(last().url, '/api/reports/r1/draft')
})

test('confirmar: POST /reports/:id/confirm con { version }', async () => {
  const r = await reports.confirmReport('P1', 'r1', { version: 2 })
  assert.deepEqual([r.status, r.version, r.confirmedBy], ['confirmed', 3, 'Dra. X'])
  assert.deepEqual(JSON.parse(last().body), { version: 2 })
})

test('historial y una versión concreta', async () => {
  const list = await reports.listReportVersions('r1')
  assert.deepEqual(list.map((v) => v.version), [2, 1])
  assert.equal(last().url, '/api/reports/r1/versions')
  const v = await reports.getReportVersion('P1', 'r1', 1)
  assert.equal(v.version, 1)
  assert.equal(last().url, '/api/reports/r1/versions/1')
})

test('seguridad: un reporte de otro paciente se rechaza aunque el backend lo envíe', async () => {
  await assert.rejects(reports.getLatestReport('P9'), (e) => e.kind === 'mismatch')
})

test('transcripción: sube el audio como multipart con paciente y archivo', async () => {
  const file = new File([new Uint8Array([1, 2, 3])], 'nota.m4a', { type: 'audio/mp4' })
  const r = await transcription.transcribeAudio('P1', file)
  assert.deepEqual([r.status, r.text, r.isSynthetic], ['ready', 'hola mundo', false])
  assert.match(last().type, /^multipart\/form-data; boundary=/)
  assert.match(last().body, /name="patientId"[\s\S]*P1/)
  assert.match(last().body, /name="audio"; filename="nota.m4a"/)
})

test('transcripción: 501 => "no conectado" y sin texto', async () => {
  const file = new File([new Uint8Array([1])], 'a.m4a', { type: 'audio/mp4' })
  assert.deepEqual(await transcription.transcribeAudio('P-501', file), { status: 'not_connected' })
})

test('enviar a revisión: POST /reports/:id/review con { version }', async () => {
  const r = await reports.markReportInReview('P1', 'r1', { version: 2 })
  assert.deepEqual([r.status, r.version], ['in_review', 3])
  assert.equal(last().method, 'POST')
  assert.equal(last().url, '/api/reports/r1/review')
  assert.deepEqual(JSON.parse(last().body), { version: 2 })
})

test('listado de reportes: GET /reports?limit y orden por fecha (el más reciente primero)', async () => {
  const { items, total } = await reports.listReports({ limit: 50 })
  assert.equal(last().url, '/api/reports?limit=50')
  assert.deepEqual(items.map((i) => [i.patientId, i.status]), [['P2', 'confirmed'], ['P1', 'in_review']])
  assert.equal(items[1].patientLabel, 'Paciente Uno')
  assert.equal(items[0].patientLabel, 'P2') // sin nombre: se muestra el id
  assert.equal(total, 2)
})

test('listado de reportes: si el backend aún no lo implementa (501) devuelve una lista vacía', async () => {
  assert.deepEqual(await reports.listReports({ limit: 7 }), { items: [], total: 0 })
})
