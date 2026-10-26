import React, { useState } from 'react'
import { Building2, Clock, MapPin, BellRing } from 'lucide-react'
import { CLINIC } from '../../data/mockData.js'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-mist-100 py-3.5 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist-50 text-ink-500">
        <Icon size={16} strokeWidth={2.15} />
      </div>
      <div>
        <p className="text-xs text-ink-300">{label}</p>
        <p className="text-sm font-medium text-ink-900">{value}</p>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-nuvia-500' : 'bg-ink-100'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [reminder48h, setReminder48h] = useState(true)
  const [reminder24h, setReminder24h] = useState(true)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink-900">Configuración</h1>
      <p className="mt-1 text-sm text-ink-500">Datos de la clínica y preferencias de recordatorios.</p>

      <div className="mt-6 rounded-xl2 border border-ink-100 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">Información de la clínica</h2>
        <InfoRow icon={Building2} label="Nombre" value={CLINIC.name} />
        <InfoRow icon={MapPin} label="Dirección" value={CLINIC.address} />
        <InfoRow icon={Clock} label="Horario" value={CLINIC.hours} />
      </div>

      <div className="mt-5 rounded-xl2 border border-ink-100 bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-900">
          <BellRing size={16} className="text-nuvia-600" />
          Recordatorios automáticos
        </h2>
        <p className="mb-4 text-xs text-ink-300">
          NUVIA envía estos recordatorios por WhatsApp de forma automática antes de cada cita.
        </p>
        <div className="flex items-center justify-between border-b border-mist-100 py-3.5">
          <div>
            <p className="text-sm font-medium text-ink-900">Recordatorio 48 horas antes</p>
            <p className="text-xs text-ink-300">Pide confirmar, reprogramar o cancelar la cita.</p>
          </div>
          <Toggle checked={reminder48h} onChange={setReminder48h} />
        </div>
        <div className="flex items-center justify-between py-3.5">
          <div>
            <p className="text-sm font-medium text-ink-900">Recordatorio 24 horas antes</p>
            <p className="text-xs text-ink-300">Aviso final con la hora de la cita.</p>
          </div>
          <Toggle checked={reminder24h} onChange={setReminder24h} />
        </div>
      </div>

      <p className="mt-5 text-xs text-ink-300">
        Este es un prototipo visual — los cambios aquí no afectan el comportamiento de la demo.
      </p>
    </div>
  )
}
