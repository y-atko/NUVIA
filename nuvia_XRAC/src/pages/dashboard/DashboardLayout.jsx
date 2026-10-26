import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/dashboard/Sidebar.jsx'
import MobileTabBar from '../../components/dashboard/MobileTabBar.jsx'
import AppSwitcher from '../../components/ui/AppSwitcher.jsx'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-mist-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pb-24 sm:pb-16">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </div>
      </div>
      <MobileTabBar />
      <AppSwitcher />
    </div>
  )
}
