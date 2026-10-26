import React from 'react'

export default function StatCard({ label, value, icon: Icon, tone = 'nuvia' }) {
  const toneClasses = {
    nuvia: 'bg-nuvia-50 text-nuvia-600',
    amber: 'bg-amber-500/10 text-amber-600',
    sky: 'bg-sky-500/10 text-sky-600'
  }[tone]

  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses}`}>
          <Icon size={16} strokeWidth={2.25} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-ink-900">{value}</p>
    </div>
  )
}
