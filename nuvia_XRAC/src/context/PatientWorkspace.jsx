// Todo lo que pertenece al paciente seleccionado, compartido entre las pestañas
// "Expediente" y "Preparar consulta": el expediente, la información adicional, el reporte
// (con sus ediciones sin guardar) y la fuente abierta en el visor.
// El proveedor se monta con key={patientId}: al cambiar de paciente TODO se reinicia, de modo
// que nunca se mezcla información de dos pacientes.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import useAsync from '../hooks/useAsync.js'
import useReportWorkflow from '../hooks/useReportWorkflow.js'
import useConsultationInputs from '../hooks/useConsultationInputs.js'
import { getPatientRecord } from '../api/patientsApi.js'
import { rememberPatient } from '../utils/recentPatients.js'

const WorkspaceContext = createContext(null)

export function PatientWorkspaceProvider({ patientId, children }) {
  const record = useAsync((signal) => getPatientRecord(patientId, { signal }), [patientId])
  const report = useReportWorkflow(patientId)
  const consultation = useConsultationInputs(patientId)
  const [openSource, setOpenSource] = useState(null)

  const loaded = record.status === 'success' ? record.data : null
  useEffect(() => {
    if (loaded) rememberPatient({ id: loaded.patient.id || patientId, label: loaded.patient.label })
  }, [loaded, patientId])

  const value = useMemo(
    () => ({ patientId, record, report, consultation, openSource, setOpenSource }),
    [patientId, record, report, consultation, openSource]
  )
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function usePatientWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('usePatientWorkspace debe usarse dentro de PatientWorkspaceProvider')
  return ctx
}
