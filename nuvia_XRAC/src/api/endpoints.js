// RUTAS PROVISIONALES: todavía no están acordadas con backend (Chinos).
// Es el único lugar del frontend que conoce las rutas; si cambian, solo se edita aquí.
const e = encodeURIComponent

export const ENDPOINTS = {
  // --- Pacientes y expediente (docs/API_CONTRACT.md) ---
  patients: () => '/patients',
  patientRecord: (patientId) => `/patients/${e(patientId)}/record`,

  // --- Consulta, reportes y transcripción (docs/API_CONTRACT_REPORTES.md) ---
  consultationInputs: (patientId) => `/patients/${e(patientId)}/consultation-inputs`, // POST
  latestReport: (patientId) => `/patients/${e(patientId)}/reports/latest`, // GET
  generateReport: (patientId) => `/patients/${e(patientId)}/reports`, // POST
  listReports: () => '/reports', // GET
  reportVersions: (reportId) => `/reports/${e(reportId)}/versions`, // GET
  reportVersion: (reportId, version) => `/reports/${e(reportId)}/versions/${e(version)}`, // GET
  saveDraft: (reportId) => `/reports/${e(reportId)}/draft`, // PUT
  markInReview: (reportId) => `/reports/${e(reportId)}/review`, // POST
  confirmReport: (reportId) => `/reports/${e(reportId)}/confirm`, // POST
  transcriptions: () => '/transcriptions' // POST (multipart)
}
