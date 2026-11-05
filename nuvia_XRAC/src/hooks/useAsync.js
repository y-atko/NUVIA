// Ejecuta una tarea asíncrona y expone su estado: 'loading' | 'success' | 'error'.
// - Cancela la petición anterior si cambian las dependencias o se desmonta el componente.
// - `reload()` repite la consulta (botón "Reintentar").
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useAsync(task, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const taskRef = useRef(task)
  taskRef.current = task

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', data: null, error: null })

    taskRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data, error: null })
      },
      (error) => {
        const cancelled =
          controller.signal.aborted || (error && (error.kind === 'aborted' || error.name === 'AbortError'))
        if (!cancelled) setState({ status: 'error', data: null, error })
      }
    )
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...state, reload }
}
