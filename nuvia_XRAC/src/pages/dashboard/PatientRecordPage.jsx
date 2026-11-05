import React, { useMemo } from 'react'
import { FileX } from 'lucide-react'
import GeneralInfo from '../../components/record/GeneralInfo.jsx'
import SectionNav from '../../components/record/SectionNav.jsx'
import StatusStrip from '../../components/record/StatusStrip.jsx'
import StatusLegend from '../../components/record/StatusLegend.jsx'
import SummarySection from '../../components/record/SummarySection.jsx'
import AlertsPanel from '../../components/record/AlertsPanel.jsx'
import RecordsPanel from '../../components/record/RecordsPanel.jsx'
import { EmptyState } from '../../components/ui/StatusView.jsx'
import { usePatientWorkspace } from '../../context/PatientWorkspace.jsx'
import { scrollToId } from '../../utils/scroll.js'

// Pestaña "Expediente". El encabezado, la carga y los errores los resuelve PatientLayout.
export default function PatientRecordPage() {
  const { record, setOpenSource } = usePatientWorkspace()
  const data = record.data

  const firstUnverifiedClaimId = useMemo(() => {
    const item = data.sections.flatMap((s) => s.items).find((i) => i.displayStatus === 'unverified')
    return item ? item.id : null
  }, [data])

  if (data.isEmpty) {
    return (
      <div className="rounded-xl2 border border-ink-100 bg-white">
        <EmptyState
          icon={FileX}
          title="Este expediente no tiene información para resumir"
          description="El servidor no entregó datos, alertas ni registros para este paciente. Eso no significa que el paciente no tenga historial clínico."
        />
      </div>
    )
  }

  return (
    <div>
      <GeneralInfo patient={data.patient} />
      <StatusStrip counts={data.counts} firstUnverifiedClaimId={firstUnverifiedClaimId} onJump={scrollToId} />
      <div className="mt-4">
        <SectionNav sections={data.sections} alertCount={data.alerts.length} hasRecords={data.records.length > 0} />
      </div>

      <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {data.sections.length === 0 ? (
            <div className="rounded-xl2 border border-ink-100 bg-white">
              <EmptyState title="Sin resumen disponible" description="El servidor no entregó secciones de resumen para este expediente." />
            </div>
          ) : (
            data.sections.map((section) => (
              <SummarySection key={section.key} section={section} onOpenSource={setOpenSource} />
            ))
          )}
        </div>

        <aside id="alerts" aria-label="Alertas" className="scroll-mt-16 lg:sticky lg:top-14 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto">
          <AlertsPanel alerts={data.alerts} onOpenSource={setOpenSource} onGoToClaim={(id) => scrollToId(`claim-${id}`)} />
        </aside>
      </div>

      <div className="mt-6 space-y-5">
        <RecordsPanel records={data.records} />
        <details className="rounded-xl2 border border-ink-100 bg-white p-5">
          <summary className="cursor-pointer text-sm font-semibold text-ink-900">Cómo leer las etiquetas</summary>
          <div className="mt-4"><StatusLegend /></div>
        </details>
      </div>
    </div>
  )
}
