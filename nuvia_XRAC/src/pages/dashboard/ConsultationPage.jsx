import React from 'react'
import InputsPanel from '../../components/consultation/InputsPanel.jsx'
import GeneratePanel from '../../components/consultation/GeneratePanel.jsx'
import ReportPanel from '../../components/consultation/ReportPanel.jsx'
import { usePatientWorkspace } from '../../context/PatientWorkspace.jsx'

// Preparar consulta: 1) información adicional, 2) generar el reporte, 3) revisarlo y confirmarlo.
export default function ConsultationPage() {
  const { report } = usePatientWorkspace()
  // En pantallas estrechas, si ya hay un reporte es lo primero que se ve.
  const reportFirst = Boolean(report.report) ? 'order-first xl:order-none' : ''
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="space-y-5">
        <InputsPanel />
        <GeneratePanel />
      </div>
      <section aria-label="Reporte clínico" className={reportFirst}>
        <ReportPanel />
      </section>
    </div>
  )
}
