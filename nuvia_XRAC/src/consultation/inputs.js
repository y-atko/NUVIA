// Información adicional que aporta el profesional durante la consulta (texto y/o audio).
// Lógica sin React para poder probarla sola. Reglas:
//  - Nada se envía a la IA sin que el profesional lo haya REVISADO.
//  - Si se edita un texto ya revisado, vuelve a quedar "sin revisar".
//  - El texto escrito y la transcripción se mantienen separados y se identifican como
//    "información de la consulta", distinta de lo documentado en el expediente.
//  - Todo vive en memoria: no se guarda nada en el navegador.

const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'ogg', 'oga', 'webm', 'aac', 'flac', 'opus']

export const INPUT_LABELS = {
  text: 'Información aportada por el profesional en la consulta',
  transcription: 'Transcripción de audio revisada por el profesional'
}

export const initialInputs = () => ({
  text: '',
  textReviewed: false,
  audio: null, // { file, name, size, type }
  audioError: null,
  // idle | sending | manual (sin servicio: se escribe a mano) | ready (texto del servicio) | error
  transcript: { status: 'idle', text: '', reviewed: false, isSynthetic: false, provider: null, error: null }
})

// Devuelve un mensaje de error en español, o null si el archivo es aceptable.
export function validateAudioFile(file, maxMb) {
  if (!file) return 'No se seleccionó ningún archivo.'
  const ext = String(file.name || '').split('.').pop().toLowerCase()
  const looksLikeAudio = String(file.type || '').startsWith('audio/') || AUDIO_EXTENSIONS.includes(ext)
  if (!looksLikeAudio) return 'El archivo no parece de audio. Usa un formato como MP3, M4A, WAV u OGG.'
  if (!file.size) return 'El archivo de audio está vacío.'
  if (file.size > maxMb * 1024 * 1024) return `El audio pesa más de ${maxMb} MB, que es el máximo permitido.`
  return null
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const hasTranscriptBox = (state) => ['ready', 'manual'].includes(state.transcript.status)

export function inputsReducer(state, action) {
  switch (action.type) {
    case 'setText':
      return { ...state, text: action.text, textReviewed: false }
    case 'setTextReviewed':
      return state.text.trim() ? { ...state, textReviewed: action.reviewed } : state

    case 'selectAudio': // reemplaza el archivo anterior y descarta su transcripción
      return {
        ...state,
        audio: { file: action.file, name: action.file.name, size: action.file.size, type: action.file.type },
        audioError: null,
        transcript: initialInputs().transcript
      }
    case 'audioRejected':
      return { ...state, audioError: action.message }
    case 'removeAudio':
      return { ...state, audio: null, audioError: null, transcript: initialInputs().transcript }

    case 'transcribeStart':
      return { ...state, transcript: { ...initialInputs().transcript, status: 'sending' } }
    case 'transcribeDone':
      return {
        ...state,
        transcript: {
          ...initialInputs().transcript,
          status: 'ready',
          text: action.text,
          isSynthetic: action.isSynthetic === true,
          provider: action.provider || null
        }
      }
    case 'transcribeNotConnected': // no hay servicio: se ofrece escribir la transcripción a mano
      return { ...state, transcript: { ...initialInputs().transcript, status: 'manual' } }
    case 'transcribeFailed':
      return { ...state, transcript: { ...initialInputs().transcript, status: 'error', error: action.message } }

    case 'setTranscript':
      return hasTranscriptBox(state) ? { ...state, transcript: { ...state.transcript, text: action.text, reviewed: false } } : state
    case 'setTranscriptReviewed':
      return hasTranscriptBox(state) && state.transcript.text.trim()
        ? { ...state, transcript: { ...state.transcript, reviewed: action.reviewed } }
        : state

    default:
      return state
  }
}

// Solo lo REVISADO se envía. Formato de cada elemento: { kind, label, text }.
export function getReviewedInputs(state) {
  const out = []
  if (state.text.trim() && state.textReviewed) {
    out.push({ kind: 'input', label: INPUT_LABELS.text, text: state.text.trim() })
  }
  const t = state.transcript
  if (hasTranscriptBox(state) && t.text.trim() && t.reviewed) {
    out.push({ kind: 'transcription', label: INPUT_LABELS.transcription, text: t.text.trim() })
  }
  return out
}

// Avisos que BLOQUEAN la generación (texto escrito pero sin revisar).
export function getBlockingProblems(state) {
  const problems = []
  if (state.text.trim() && !state.textReviewed) {
    problems.push('Hay observaciones escritas sin revisar. Márcalas como revisadas o bórralas.')
  }
  const t = state.transcript
  if (hasTranscriptBox(state) && t.text.trim() && !t.reviewed) {
    problems.push('La transcripción no está revisada. Corrígela si hace falta y márcala como revisada.')
  }
  return problems
}

// Avisos informativos que NO bloquean.
export function getNotices(state) {
  const notices = []
  const t = state.transcript
  if (state.audio && !(hasTranscriptBox(state) && t.text.trim() && t.reviewed)) {
    notices.push('El audio no se incluye en el reporte hasta que tenga una transcripción revisada.')
  }
  return notices
}
