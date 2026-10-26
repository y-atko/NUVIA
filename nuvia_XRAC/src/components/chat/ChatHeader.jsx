import React from 'react'
import { Sparkles, BellRing } from 'lucide-react'
import { CLINIC } from '../../data/mockData.js'

export default function ChatHeader({ onOpenReminders }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-mist-200 bg-white px-4 py-3.5 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-nuvia-500 to-sky-500 text-white shadow-sm">
          <Sparkles size={18} strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight text-ink-900">NUVIA</h1>
          <p className="text-xs leading-tight text-ink-300">Asistente virtual de {CLINIC.name}</p>
        </div>
      </div>
      <button
        onClick={onOpenReminders}
        className="flex items-center gap-1.5 rounded-full border border-ink-100 px-3 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:border-nuvia-300 hover:text-nuvia-700"
      >
        <BellRing size={14} />
        <span className="hidden sm:inline">Ver recordatorios</span>
      </button>
    </div>
  )
}
