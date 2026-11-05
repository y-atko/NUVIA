import test from 'node:test'
import assert from 'node:assert/strict'
import {
  initialInputs, inputsReducer, validateAudioFile, formatFileSize,
  getReviewedInputs, getBlockingProblems, getNotices
} from './inputs.js'

const run = (...actions) => actions.reduce(inputsReducer, initialInputs())
const audio = (over = {}) => ({ name: 'nota.m4a', size: 2048, type: 'audio/mp4', ...over })

test('validación de audio: acepta audio por tipo o por extensión', () => {
  assert.equal(validateAudioFile(audio(), 25), null)
  assert.equal(validateAudioFile(audio({ type: '', name: 'x.WAV' }), 25), null)
})

test('validación de audio: rechaza otros archivos, vacíos y demasiado grandes', () => {
  assert.match(validateAudioFile(audio({ type: 'application/pdf', name: 'a.pdf' }), 25), /no parece de audio/)
  assert.match(validateAudioFile(audio({ size: 0 }), 25), /vacío/)
  assert.match(validateAudioFile(audio({ size: 26 * 1024 * 1024 }), 25), /25 MB/)
  assert.match(validateAudioFile(null, 25), /ningún archivo/)
})

test('tamaño legible', () => {
  assert.equal(formatFileSize(100), '1 KB')
  assert.equal(formatFileSize(2048), '2 KB')
  assert.equal(formatFileSize(3 * 1024 * 1024), '3.0 MB')
})

test('el texto sin revisar no se envía y bloquea la generación', () => {
  const s = run({ type: 'setText', text: 'Algo del paciente' })
  assert.deepEqual(getReviewedInputs(s), [])
  assert.equal(getBlockingProblems(s).length, 1)
})

test('el texto revisado se envía, identificado como información de la consulta', () => {
  const s = run({ type: 'setText', text: '  Dato  ' }, { type: 'setTextReviewed', reviewed: true })
  assert.deepEqual(getReviewedInputs(s).map((i) => [i.kind, i.text]), [['input', 'Dato']])
  assert.match(getReviewedInputs(s)[0].label, /profesional en la consulta/)
  assert.equal(getBlockingProblems(s).length, 0)
})

test('editar un texto ya revisado lo devuelve a "sin revisar"', () => {
  const s = run({ type: 'setText', text: 'a' }, { type: 'setTextReviewed', reviewed: true }, { type: 'setText', text: 'ab' })
  assert.equal(s.textReviewed, false)
  assert.deepEqual(getReviewedInputs(s), [])
})

test('no se puede marcar como revisado un texto vacío', () => {
  assert.equal(run({ type: 'setTextReviewed', reviewed: true }).textReviewed, false)
  assert.equal(run({ type: 'setText', text: '   ' }, { type: 'setTextReviewed', reviewed: true }).textReviewed, false)
})

test('audio: seleccionar, reemplazar (descarta la transcripción) y eliminar', () => {
  let s = run({ type: 'selectAudio', file: audio() }, { type: 'transcribeDone', text: 'texto', isSynthetic: false })
  assert.equal(s.transcript.status, 'ready')
  s = inputsReducer(s, { type: 'selectAudio', file: audio({ name: 'otra.wav' }) })
  assert.equal(s.audio.name, 'otra.wav')
  assert.equal(s.transcript.status, 'idle')
  s = inputsReducer(s, { type: 'removeAudio' })
  assert.deepEqual([s.audio, s.transcript.status], [null, 'idle'])
})

test('audio seleccionado sin transcripción: solo aviso informativo, no bloquea ni se envía', () => {
  const s = run({ type: 'selectAudio', file: audio() })
  assert.equal(getNotices(s).length, 1)
  assert.equal(getBlockingProblems(s).length, 0)
  assert.deepEqual(getReviewedInputs(s), [])
})

test('sin servicio de transcripción: no se inventa texto; se escribe a mano y debe revisarse', () => {
  let s = run({ type: 'selectAudio', file: audio() }, { type: 'transcribeStart' }, { type: 'transcribeNotConnected' })
  assert.equal(s.transcript.status, 'manual')
  assert.equal(s.transcript.text, '')
  assert.deepEqual(getReviewedInputs(s), [])
  s = inputsReducer(s, { type: 'setTranscript', text: 'Lo que dice el audio' })
  assert.equal(getBlockingProblems(s).length, 1)
  s = inputsReducer(s, { type: 'setTranscriptReviewed', reviewed: true })
  assert.deepEqual(getReviewedInputs(s).map((i) => [i.kind, i.text]), [['transcription', 'Lo que dice el audio']])
})

test('antes de transcribir no se puede escribir ni revisar una transcripción', () => {
  const s = run({ type: 'selectAudio', file: audio() }, { type: 'setTranscript', text: 'x' }, { type: 'setTranscriptReviewed', reviewed: true })
  assert.deepEqual([s.transcript.text, s.transcript.reviewed], ['', false])
})

test('transcripción: hay que revisarla antes de usarla; corregirla la vuelve a dejar sin revisar', () => {
  let s = run({ type: 'selectAudio', file: audio() }, { type: 'transcribeDone', text: 'borrador', isSynthetic: true, provider: 'P' })
  assert.equal(s.transcript.isSynthetic, true)
  assert.equal(getBlockingProblems(s).length, 1)
  assert.deepEqual(getReviewedInputs(s), [])
  s = inputsReducer(s, { type: 'setTranscriptReviewed', reviewed: true })
  assert.deepEqual(getReviewedInputs(s).map((i) => i.kind), ['transcription'])
  s = inputsReducer(s, { type: 'setTranscript', text: 'corregido' })
  assert.equal(s.transcript.reviewed, false)
  assert.equal(getBlockingProblems(s).length, 1)
})

test('texto y transcripción revisados se envían por separado y en ese orden', () => {
  const s = run(
    { type: 'setText', text: 'Escrito' }, { type: 'setTextReviewed', reviewed: true },
    { type: 'selectAudio', file: audio() }, { type: 'transcribeDone', text: 'Hablado' }, { type: 'setTranscriptReviewed', reviewed: true }
  )
  assert.deepEqual(getReviewedInputs(s).map((i) => i.kind), ['input', 'transcription'])
})

test('error de transcripción y audio rechazado', () => {
  const s = run({ type: 'selectAudio', file: audio() }, { type: 'transcribeFailed', message: 'Falló' })
  assert.deepEqual([s.transcript.status, s.transcript.error], ['error', 'Falló'])
  assert.equal(run({ type: 'audioRejected', message: 'No' }).audioError, 'No')
})
