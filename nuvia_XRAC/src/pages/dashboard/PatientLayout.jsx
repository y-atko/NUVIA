import React, { useEffect } from 'react'
import { Link, NavLink, Outlet, useBlocker, useParams } from 'react-router-dom'
import { UserX } from 'lucide-react'
import PatientHeader from '../../components/record/PatientHeader.jsx'
import SourceModal from '../../components/record/SourceModal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/StatusView.jsx'
import { PatientWorkspaceProvider, usePatientWorkspace } from '../../context/PatientWorkspace.jsx'
import { isSamePatientPath } from '../../utils/paths.js'

const tabClass = ({ isActive }) =>
  `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'border-nuvia-500 text-nuvia-700' : 'border-transparent text-ink-500 hover:text-ink-900'
  }`

function LayoutBody() {
  const { patientId, record, report, openSource, setOpenSource } = usePatientWorkspace()
  const dirty = report.dirty

  // Cambios sin guardar: se avisa al salir del paciente (pero no al cambiar de pestaña).
  const blocker = useBlocker(({ nextLocation }) => dirty && !isSamePatientPath(nextLocation.pathname, patientId))
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (record.status === 'loading') return <LoadingState label="Cargando expediente…" className="py-24" />

  if (record.status === 'error') {
    if (record.error && record.error.kind === 'http' && record.error.status === 404) {
      return (
        <EmptyState
          icon={UserX}
          title="No se encontró el paciente"
          description={`El servidor no tiene un expediente con el identificador «${patientId}».`}
          className="py-24"
        >
          <Link to="/dashboard/pacientes" className="text-sm font-medium text-nuvia-700 hover:underline">Volver a pacientes</Link>
        </EmptyState>
      )
    }
    return (
      <div>
        <Link to="/dashboard/pacientes" className="text-sm font-medium text-ink-500 hover:text-nuvia-700">Volver a pacientes</Link>
        <ErrorState error={record.error} onRetry={record.reload} className="mt-4" />
      </div>
    )
  }

  const base = `/dashboard/pacientes/${encodeURIComponent(patientId)}`
  return (
    <div>
      <PatientHeader patient={record.data.patient} reportStatus={report.report ? report.report.status : null} />

      <nav aria-label="Secciones del paciente" className="mt-5 flex gap-1 border-b border-mist-200">
        <NavLink to={base} end className={tabClass}>Expediente</NavLink>
        <NavLink to={`${base}/consulta`} className={tabClass}>
          Preparar consulta
          {dirty && <span role="img" aria-label="con cambios sin guardar" className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500" />}
        </NavLink>
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>

      <SourceModal source={openSource} records={record.data.records} onClose={() => setOpenSource(null)} />

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        danger
        title="Tienes cambios sin guardar"
        description="Si sales ahora se perderán las ediciones del reporte que no guardaste como borrador."
        confirmLabel="Salir sin guardar"
        cancelLabel="Quedarme"
        onCancel={() => blocker.reset()}
        onConfirm={() => blocker.proceed()}
      />
    </div>
  )
}

export default function PatientLayout() {
  const { patientId } = useParams()
  // key: al cambiar de paciente se reinicia TODO el estado (nunca se mezclan dos pacientes).
  return (
    <PatientWorkspaceProvider key={patientId} patientId={patientId}>
      <LayoutBody />
    </PatientWorkspaceProvider>
  )
}
