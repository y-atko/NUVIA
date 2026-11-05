import React, { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import Avatar from '../../components/ui/Avatar.jsx'
import ReportStatusBadge from '../../components/consultation/ReportStatusBadge.jsx'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/StatusView.jsx'
import useAsync from '../../hooks/useAsync.js'
import { listReports } from '../../api/reportsApi.js'
import { stageOf } from '../../report/reportStatus.js'
import { formatDateTime } from '../../utils/dateHelpers.js'

const FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'draft', label: 'Borradores' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'confirmed', label: 'Confirmados' }
]

// Historial de reportes: el último de cada paciente, con su estado.
export default function ReportsPage() {
  const [params, setParams] = useSearchParams()
  const filter = FILTERS.some((f) => f.value === params.get('estado')) ? params.get('estado') : 'todos'
  const state = useAsync((signal) => listReports({ limit: 200, signal }), [])
  const items = state.status === 'success' ? state.data.items : []

  const counts = useMemo(() => {
    const out = { todos: items.length, draft: 0, in_review: 0, confirmed: 0 }
    items.forEach((r) => { out[stageOf(r.status)] += 1 })
    return out
  }, [items])
  const visible = filter === 'todos' ? items : items.filter((r) => stageOf(r.status) === filter)

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">Reportes</h1>
      <p className="mt-1 text-sm text-ink-500">El reporte más reciente de cada paciente y su estado.</p>

      <div role="tablist" aria-label="Filtrar por estado" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setParams(f.value === 'todos' ? {} : { estado: f.value }, { replace: true })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-nuvia-600 text-white' : 'bg-white text-ink-700 ring-1 ring-inset ring-ink-100 hover:bg-mist-100'
            }`}
          >
            {f.label} <span className={filter === f.value ? 'text-white/80' : 'text-ink-300'}>{state.status === 'success' ? counts[f.value] : ''}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {state.status === 'loading' && <LoadingState label="Cargando reportes…" />}
        {state.status === 'error' && <ErrorState error={state.error} onRetry={state.reload} />}
        {state.status === 'success' && visible.length === 0 && (
          <div className="rounded-xl2 border border-ink-100 bg-white">
            <EmptyState
              icon={FileText}
              title={filter === 'todos' ? 'Todavía no hay reportes' : 'No hay reportes con este estado'}
              description="Los reportes aparecen aquí cuando preparas una consulta desde la ficha de un paciente."
            />
          </div>
        )}
        {state.status === 'success' && visible.length > 0 && (
          <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-200 text-xs text-ink-300">
                  <th scope="col" className="px-5 py-3 font-medium">Paciente</th>
                  <th scope="col" className="px-5 py-3 font-medium">Estado</th>
                  <th scope="col" className="px-5 py-3 font-medium">Versión</th>
                  <th scope="col" className="px-5 py-3 font-medium">Actualizado</th>
                  <th scope="col" className="px-5 py-3 font-medium">Confirmado por</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-b border-mist-100 last:border-0 hover:bg-mist-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.patientLabel} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink-900">{r.patientLabel}</p>
                          <p className="text-xs text-ink-300">{r.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><ReportStatusBadge status={r.status} /></td>
                    <td className="px-5 py-3.5 text-ink-500">{r.version ?? '–'}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-ink-500">{formatDateTime(r.updatedAt) || '–'}</td>
                    <td className="px-5 py-3.5 text-ink-500">{stageOf(r.status) === 'confirmed' ? r.confirmedBy || '–' : '–'}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <Link to={`/dashboard/pacientes/${encodeURIComponent(r.patientId)}/consulta`} className="text-xs font-semibold text-nuvia-700 hover:underline">
                        Abrir reporte
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
