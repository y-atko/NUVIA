// Flujo del reporte clínico de un paciente: cargar el último reporte, generarlo, editarlo,
// guardar borrador, confirmar, restaurar la versión de IA y consultar el historial.
//
// Regla central: el contenido editado (buffer) es SOLO local hasta que el profesional pulsa
// "Guardar borrador"; nada se guarda ni se confirma automáticamente.
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { createEditorState, editorReducer, findEmptyItems, isDirty, toDraftPayload } from '../report/reportEditor.js'
import {
  classifyGenerationFailure,
  confirmReport,
  describeReportError,
  generateReport,
  getLatestReport,
  getReportVersion,
  listReportVersions,
  markReportInReview,
  saveReportDraft
} from '../api/reportsApi.js'
import { submitConsultationInputs } from '../api/consultationApi.js'

const isAborted = (err) => err && (err.kind === 'aborted' || err.name === 'AbortError')

export default function useReportWorkflow(patientId) {
  const [load, setLoad] = useState({ status: 'loading', error: null })
  const [attempt, setAttempt] = useState(0)
  const [editor, dispatch] = useReducer(editorReducer, null) // null mientras no hay reporte
  const [editing, setEditing] = useState(false)
  const [generation, setGeneration] = useState({ phase: 'idle', failure: null })
  const [busy, setBusy] = useState(null) // null | 'saving' | 'submitting' | 'confirming' | 'restoring'
  const [actionError, setActionError] = useState(null)
  const [versions, setVersions] = useState({ status: 'idle', items: [], error: null })
  const [viewing, setViewing] = useState(null) // { status, version, report, error }
  const generationController = useRef(null)

  // Carga del último reporte del paciente.
  useEffect(() => {
    const controller = new AbortController()
    setLoad({ status: 'loading', error: null })
    getLatestReport(patientId, { signal: controller.signal }).then(
      (report) => {
        if (controller.signal.aborted) return
        if (report) dispatch({ type: 'load', report })
        setLoad({ status: 'success', error: null })
      },
      (error) => {
        if (!controller.signal.aborted && !isAborted(error)) setLoad({ status: 'error', error })
      }
    )
    return () => controller.abort()
  }, [patientId, attempt])

  // Al desmontar (cambio de paciente), se cancela cualquier generación en curso.
  useEffect(() => () => generationController.current && generationController.current.abort(), [])

  const report = editor ? editor.base : null
  const dirty = editor ? isDirty(editor) : false

  const generate = useCallback(
    async (reviewedInputs, recordGeneratedAt = null) => {
      const controller = new AbortController()
      generationController.current = controller
      setActionError(null)
      setGeneration({ phase: reviewedInputs.length ? 'submitting' : 'generating', failure: null })
      try {
        const submitted = await submitConsultationInputs(patientId, reviewedInputs, { signal: controller.signal })
        setGeneration({ phase: 'generating', failure: null })
        const generated = await generateReport(
          patientId,
          { inputIds: submitted.map((i) => i.id), recordGeneratedAt },
          { signal: controller.signal }
        )
        dispatch({ type: 'load', report: generated })
        setEditing(false)
        setVersions({ status: 'idle', items: [], error: null })
        setGeneration({ phase: 'done', failure: null })
      } catch (err) {
        if (isAborted(err)) setGeneration({ phase: 'idle', failure: null })
        else setGeneration({ phase: 'failed', failure: classifyGenerationFailure(err) })
      }
    },
    [patientId]
  )

  const cancelGeneration = useCallback(() => {
    if (generationController.current) generationController.current.abort()
  }, [])

  // Guarda el buffer como una nueva versión en estado "borrador". Devuelve el reporte guardado.
  const persistDraft = async () => {
    const empty = findEmptyItems(editor)
    if (empty.length > 0) {
      const err = new Error('empty')
      err.userMessage = {
        title: 'Hay elementos sin texto',
        detail: 'Escribe el texto o elimina esos elementos antes de guardar.'
      }
      throw err
    }
    const saved = await saveReportDraft(patientId, editor.base.id, toDraftPayload(editor))
    dispatch({ type: 'load', report: saved })
    return saved
  }

  const run = async (name, task) => {
    if (busy || !editor) return false
    setBusy(name)
    setActionError(null)
    try {
      await task()
      return true
    } catch (err) {
      setActionError(err.userMessage || describeReportError(err))
      return false
    } finally {
      setBusy(null)
    }
  }

  const saveDraft = () => run('saving', persistDraft)

  // Confirmar guarda primero los cambios pendientes (si los hay) y confirma ESA versión.
  const confirm = () =>
    run('confirming', async () => {
      const target = dirty ? await persistDraft() : editor.base
      const confirmed = await confirmReport(patientId, target.id, { version: target.version })
      dispatch({ type: 'load', report: confirmed })
      setEditing(false)
      setVersions({ status: 'idle', items: [], error: null })
    })

  // Enviar a revisión guarda primero los cambios pendientes (si los hay) y pasa ESA versión a "En revisión".
  const submitForReview = () =>
    run('submitting', async () => {
      const target = dirty ? await persistDraft() : editor.base
      const reviewed = await markReportInReview(patientId, target.id, { version: target.version })
      dispatch({ type: 'load', report: reviewed })
      setEditing(false)
      setVersions({ status: 'idle', items: [], error: null })
    })

  const discard = () => {
    dispatch({ type: 'discard' })
    setActionError(null)
  }

  // Trae la versión generada por la IA y la carga en el buffer (sin guardarla).
  const restoreAi = () =>
    run('restoring', async () => {
      const aiVersion = await getReportVersion(patientId, editor.base.id, editor.base.generatedVersion ?? 1)
      dispatch({ type: 'replaceContent', report: aiVersion })
    })

  const loadVersions = async () => {
    if (!report) return
    setVersions({ status: 'loading', items: [], error: null })
    try {
      setVersions({ status: 'success', items: await listReportVersions(report.id), error: null })
    } catch (error) {
      setVersions({ status: 'error', items: [], error })
    }
  }

  const openVersion = async (version) => {
    setViewing({ status: 'loading', version, report: null, error: null })
    try {
      setViewing({ status: 'success', version, report: await getReportVersion(patientId, report.id, version), error: null })
    } catch (error) {
      setViewing({ status: 'error', version, report: null, error })
    }
  }

  return {
    load,
    reloadReport: () => setAttempt((n) => n + 1),
    editor,
    report,
    dirty,
    dispatch,
    editing,
    setEditing,
    generation,
    generate,
    cancelGeneration,
    resetGeneration: () => setGeneration({ phase: 'idle', failure: null }),
    busy,
    actionError,
    clearActionError: () => setActionError(null),
    saveDraft,
    submitForReview,
    confirm,
    discard,
    restoreAi,
    versions,
    loadVersions,
    viewing,
    openVersion,
    closeVersion: () => setViewing(null)
  }
}
