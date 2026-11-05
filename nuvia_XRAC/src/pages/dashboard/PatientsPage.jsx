import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Search, SearchX, UserX } from 'lucide-react'
import Avatar from '../../components/ui/Avatar.jsx'
import ReportStatusBadge from '../../components/consultation/ReportStatusBadge.jsx'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/StatusView.jsx'
import useAsync from '../../hooks/useAsync.js'
import { listPatients } from '../../api/patientsApi.js'
import { listReports } from '../../api/reportsApi.js'
import { formatDisplayDate } from '../../utils/dateHelpers.js'

const DASH = <span className="text-ink-300">–</span>

export default function PatientsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(params.get('q') || '')
  const [query, setQuery] = useState(text.trim())

  // Espera a que termine de escribir antes de consultar y refleja la búsqueda en la URL.
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = text.trim()
      setQuery(q)
      setParams(q ? { q } : {}, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const result = useAsync((signal) => listPatients({ q: query, limit: 50, signal }), [query])
  // El estado del reporte es un complemento: si falla o no existe, la lista sigue funcionando.
  const reports = useAsync((signal) => listReports({ limit: 200, signal }).catch(() => ({ items: [] })), [])
  const statusByPatient = useMemo(
    () => new Map((reports.status === 'success' ? reports.data.items : []).map((r) => [r.patientId, r.status])),
    [reports]
  )

  const items = result.status === 'success' ? result.data.items : []
  const showLastRecord = items.some((p) => p.lastRecordDate)
  const open = (id) => navigate(`/dashboard/pacientes/${encodeURIComponent(id)}`)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">Pacientes</h1>
          <p className="mt-1 text-sm text-ink-500" aria-live="polite">
            {result.status === 'success' && `${items.length} ${items.length === 1 ? 'paciente' : 'pacientes'}${query ? ` para «${query}»` : ''}`}
            {result.status === 'loading' && 'Buscando…'}
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" aria-hidden="true" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nombre o expediente"
            aria-label="Buscar paciente"
            className="w-72 rounded-xl border border-ink-100 bg-white py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-nuvia-500"
          />
        </div>
      </div>

      <div className="mt-6">
        {result.status === 'loading' && <LoadingState label="Buscando pacientes…" />}
        {result.status === 'error' && <ErrorState error={result.error} onRetry={result.reload} />}

        {result.status === 'success' && items.length === 0 && (
          <div className="rounded-xl2 border border-ink-100 bg-white">
            {query ? (
              <EmptyState icon={SearchX} title={`Sin resultados para «${query}»`} description="Revisa la ortografía o prueba con el número de expediente." />
            ) : (
              <EmptyState icon={UserX} title="No hay pacientes disponibles" description="El servidor respondió sin ningún paciente." />
            )}
          </div>
        )}

        {result.status === 'success' && items.length > 0 && (
          <div className="overflow-x-auto rounded-xl2 border border-ink-100 bg-white">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-mist-200 text-xs text-ink-300">
                  <th scope="col" className="px-5 py-3 font-medium">Paciente</th>
                  <th scope="col" className="px-5 py-3 font-medium">Edad</th>
                  <th scope="col" className="px-5 py-3 font-medium">Sexo</th>
                  {showLastRecord && <th scope="col" className="px-5 py-3 font-medium">Último registro</th>}
                  <th scope="col" className="px-5 py-3 font-medium">Reporte</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} onClick={() => open(p.id)} className="cursor-pointer border-b border-mist-100 last:border-0 hover:bg-mist-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.label} size="sm" />
                        <div className="min-w-0">
                          <Link to={`/dashboard/pacientes/${encodeURIComponent(p.id)}`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-ink-900 hover:text-nuvia-700">
                            {p.label}
                          </Link>
                          <p className="text-xs text-ink-300">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500">{p.age || DASH}</td>
                    <td className="px-5 py-3.5 text-ink-500">{p.sex || DASH}</td>
                    {showLastRecord && <td className="px-5 py-3.5 text-ink-500">{formatDisplayDate(p.lastRecordDate) || DASH}</td>}
                    <td className="px-5 py-3.5">
                      {statusByPatient.has(p.id) ? <ReportStatusBadge status={statusByPatient.get(p.id)} /> : <span className="text-xs text-ink-300">Sin reporte</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <Link to={`/dashboard/pacientes/${encodeURIComponent(p.id)}/consulta`} onClick={(e) => e.stopPropagation()} className="text-xs font-semibold text-nuvia-700 hover:underline">
                        Preparar consulta
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
