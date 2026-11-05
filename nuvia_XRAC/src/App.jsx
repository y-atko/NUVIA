import React from 'react'
import { Navigate } from 'react-router-dom'
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx'
import DashboardHome from './pages/dashboard/DashboardHome.jsx'
import PatientsPage from './pages/dashboard/PatientsPage.jsx'
import PatientLayout from './pages/dashboard/PatientLayout.jsx'
import PatientRecordPage from './pages/dashboard/PatientRecordPage.jsx'
import ConsultationPage from './pages/dashboard/ConsultationPage.jsx'
import ReportsPage from './pages/dashboard/ReportsPage.jsx'
import SettingsPage from './pages/dashboard/SettingsPage.jsx'

// Rutas de la aplicación. Se usa un "data router" (createBrowserRouter) porque permite avisar
// al profesional cuando intenta salir con cambios sin guardar en el reporte.
export const routes = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'pacientes', element: <PatientsPage /> },
      {
        path: 'pacientes/:patientId',
        element: <PatientLayout />,
        children: [
          { index: true, element: <PatientRecordPage /> },
          { path: 'consulta', element: <ConsultationPage /> }
        ]
      },
      { path: 'reportes', element: <ReportsPage /> },
      { path: 'configuracion', element: <SettingsPage /> }
    ]
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> }
]
