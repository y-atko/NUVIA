import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Avatar from '../../components/ui/Avatar.jsx'
import Button from '../../components/ui/Button.jsx'
import ReportRow from '../../components/consultation/ReportRow.jsx'
import { LoadingState, ErrorState } from '../../components/ui/StatusView.jsx'
import useAsync from '../../hooks/useAsync.js'
import { listPatients } from '../../api/patientsApi.js'
import { listReports } from '../../api/reportsApi.js'
import { isPending, stageOf } from '../../report/reportStatus.js'
import { getRecentPatients } from '../../utils/recentPatients.js'
import { greetingFor, longDate } from '../../utils/greeting.js'

const STAGE_LINKS = [
  { stage: 'draft', label: 'Borradores', query: 'draft' },
  { stage: 'in_review', label: 'En revisión', query: 'in_review' },
  { stage: 'confirmed', label: 'Confirmados', query: 'confirmed' }
]

function Panel({ title, action, children }) {
  return (
    <section className="rounded-xl2 border border-ink-100 bg-white p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-ink-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function DashboardHome() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const reports = useAsync((signal) => listReports({ limit: 100, signal }), [])
  const patients = useAsync((signal) => listPatients({ limit: 50, signal }), [])

  const items = reports.status === 'success' ? reports.data.items : []
  const counts = useMemo(() => {
    const out = { draft: 0, in_review: 0, confirmed: 0 }
    items.forEach((r) => { out[stageOf(r.status)] += 1 })
    return out
  }, [items])

  // Pendientes: primero los que están en revisión, luego los borradores (del más reciente al más antiguo).
  const pending = useMemo(
    () => items.filter((r) => isPending(r.status)).sort((a, b) => Number(stageOf(b.status) === 'in_review') - Number(stageOf(a.status) === 'in_review')),
    [items]
  )

  // Recientes: los que abriste en esta sesión y, para completar, los de actividad más reciente.
  const recentPatients = useMemo(() => {
    const all = patients.status === 'success' ? patients.data.items : []
    const byId = new Map(all.map((p) => [p.id, p]))
    const session = getRecentPatients().map((p) => byId.get(p.id) || { id: p.id, label: p.label })
    const rest = [...all].sort((a, b) => String(b.lastRecordDate || '').localeCompare(String(a.lastRecordDate || '')))
    const seen = new Set()
    return [...session, ...rest].filter((p) => !seen.has(p.id) && seen.add(p.id)).slice(0, 5)
  }, [patients])

  function search(event) {
    event.preventDefault()
    const q = query.trim()
    navigate(`/dashboard/pacientes${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  const loading = reports.status === 'loading'
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm text-ink-500">{longDate()}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink-900">{greetingFor()}</h1>
          <p className="mt-1 text-sm text-ink-500">Estos son tus reportes y pacientes de hoy.</p>
        </div>
        <form onSubmit={search} role="search" className="flex w-full max-w-md gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar paciente"
              aria-label="Buscar paciente"
              className="w-full rounded-xl border border-ink-100 bg-white py-3 pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-nuvia-500"
            />
          </div>
          <Button type="submit" size="lg">Buscar</Button>
        </form>
      </header>

      <section aria-label="Resumen de reportes" className="mt-7 grid grid-cols-3 divide-x divide-mist-200 rounded-xl2 border border-ink-100 bg-white">
        {STAGE_LINKS.map((s) => (
          <Link key={s.stage} to={`/dashboard/reportes?estado=${s.query}`} className="px-5 py-4 transition-colors first:rounded-l-xl2 last:rounded-r-xl2 hover:bg-mist-50">
            <p className="font-display text-3xl font-extrabold text-ink-900">{loading ? '–' : counts[s.stage]}</p>
            <p className="mt-0.5 text-sm text-ink-500">{s.label}</p>
          </Link>
        ))}
      </section>

      {reports.status === 'error' && <ErrorState error={reports.error} onRetry={reports.reload} className="mt-5" />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title="Consultas preparadas recientemente" action={<Link to="/dashboard/reportes" className="text-xs font-semibold text-nuvia-700 hover:underline">Ver todos</Link>}>
          {loading ? <LoadingState className="py-8" /> : items.length === 0 ? (
            <p className="py-6 text-sm text-ink-500">Aún no has preparado ninguna consulta. Elige un paciente para empezar.</p>
          ) : (
            <ul className="-mx-2 mt-1 divide-y divide-mist-100">{items.slice(0, 6).map((r) => <ReportRow key={r.id} report={r} />)}</ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Pendientes de revisión">
            {loading ? <LoadingState className="py-8" /> : pending.length === 0 ? (
              <p className="py-4 text-sm text-ink-500">No tienes reportes pendientes.</p>
            ) : (
              <ul className="-mx-2 mt-1 divide-y divide-mist-100">{pending.slice(0, 4).map((r) => <ReportRow key={r.id} report={r} compact />)}</ul>
            )}
          </Panel>

          <Panel title="Pacientes recientes" action={<Link to="/dashboard/pacientes" className="text-xs font-semibold text-nuvia-700 hover:underline">Ver todos</Link>}>
            {patients.status === 'loading' ? <LoadingState className="py-8" /> : recentPatients.length === 0 ? (
              <p className="py-4 text-sm text-ink-500">Todavía no hay pacientes.</p>
            ) : (
              <ul className="mt-1 divide-y divide-mist-100">
                {recentPatients.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={p.label} size="sm" />
                    <Link to={`/dashboard/pacientes/${encodeURIComponent(p.id)}`} className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 hover:text-nuvia-700">
                      {p.label}
                    </Link>
                    <Link to={`/dashboard/pacientes/${encodeURIComponent(p.id)}/consulta`} className="shrink-0 text-xs font-semibold text-nuvia-700 hover:underline">
                      Preparar consulta
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
