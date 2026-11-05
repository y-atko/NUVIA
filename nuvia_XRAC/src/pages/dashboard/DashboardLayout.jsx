import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/dashboard/Sidebar.jsx'
import MobileTabBar from '../../components/dashboard/MobileTabBar.jsx'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-mist-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pb-24 sm:pb-12">
        <main className="mx-auto max-w-6xl animate-rise px-4 py-7 sm:px-10 sm:py-10">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
