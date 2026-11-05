// Estado de la información adicional de la consulta (texto + audio + transcripción).
// Todo vive en memoria: nada se guarda en el navegador. El audio solo sale hacia el backend
// cuando el profesional pulsa "Enviar a transcripción".
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { MAX_AUDIO_MB } from '../api/config.js'
import { describeError } from '../api/client.js'
import { transcribeAudio } from '../api/transcriptionApi.js'
import {
  getBlockingProblems, getNotices, getReviewedInputs, initialInputs, inputsReducer, validateAudioFile
} from '../consultation/inputs.js'

export default function useConsultationInputs(patientId) {
  const [inputs, dispatch] = useReducer(inputsReducer, undefined, initialInputs)
  const controller = useRef(null)

  useEffect(() => () => controller.current && controller.current.abort(), [])

  // Vista previa local del audio (no se sube a ningún lado).
  const previewUrl = useMemo(() => {
    if (!inputs.audio || typeof URL === 'undefined' || !URL.createObjectURL) return null
    return URL.createObjectURL(inputs.audio.file)
  }, [inputs.audio])
  useEffect(() => () => previewUrl && URL.revokeObjectURL && URL.revokeObjectURL(previewUrl), [previewUrl])

  const selectAudio = useCallback((file) => {
    const problem = validateAudioFile(file, MAX_AUDIO_MB)
    if (problem) dispatch({ type: 'audioRejected', message: problem })
    else dispatch({ type: 'selectAudio', file })
  }, [])

  const removeAudio = useCallback(() => {
    if (controller.current) controller.current.abort()
    dispatch({ type: 'removeAudio' })
  }, [])

  const transcribe = useCallback(async () => {
    if (!inputs.audio) return
    const current = new AbortController()
    controller.current = current
    dispatch({ type: 'transcribeStart' })
    try {
      const result = await transcribeAudio(patientId, inputs.audio.file, { signal: current.signal })
      if (current.signal.aborted) return
      if (result.status === 'not_connected') dispatch({ type: 'transcribeNotConnected' })
      else dispatch({ type: 'transcribeDone', text: result.text, isSynthetic: result.isSynthetic, provider: result.provider })
    } catch (err) {
      if (current.signal.aborted || (err && err.kind === 'aborted')) return
      dispatch({ type: 'transcribeFailed', message: describeError(err).title })
    }
  }, [patientId, inputs.audio])

  return {
    inputs,
    dispatch,
    previewUrl,
    selectAudio,
    removeAudio,
    transcribe,
    reviewed: getReviewedInputs(inputs),
    blocking: getBlockingProblems(inputs),
    notices: getNotices(inputs)
  }
}
