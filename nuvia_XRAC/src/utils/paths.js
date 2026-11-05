// ¿Esta ruta sigue dentro del mismo paciente? (Expediente y Preparar consulta comparten estado.)
export function isSamePatientPath(pathname, patientId) {
  const base = `/dashboard/pacientes/${encodeURIComponent(patientId)}`
  return pathname === base || pathname.startsWith(`${base}/`)
}
