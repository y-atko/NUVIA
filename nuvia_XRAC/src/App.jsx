import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ChatPage from './pages/chat/ChatPage.jsx'
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx'
import DashboardHome from './pages/dashboard/DashboardHome.jsx'
import AgendaPage from './pages/dashboard/AgendaPage.jsx'
import PatientsPage from './pages/dashboard/PatientsPage.jsx'
import SettingsPage from './pages/dashboard/SettingsPage.jsx'
import AppSwitcher from './components/ui/AppSwitcher.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="pacientes" element={<PatientsPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
      <AppSwitcher />
    </>
  )
}
