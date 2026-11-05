import React, { useState } from 'react'
import { Database, FileText, Mic, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import { describeError } from '../../api/client.js'
import { checkConnection } from '../../api/patientsApi.js'
import { API_BASE_URL, CONTRACT_VERSION, DATA_SOURCE, REPORTS_SOURCE, TRANSCRIPTION_SOURCE } from '../../api/config.js'
import { API_SCENARIOS, AI_SCENARIOS, TRANSCRIPTION_SCENARIOS, getSimulation, resetSimulation, setSimulation } from '../../api/mock/simulation.js'
import { resetMockReports } from '../../api/mock/mockReports.js'
import { getServiceStatuses } from '../../api/serviceStatus.js'
import { clearRecentPatients } from '../../utils/recentPatients.js'

const ICONS = { patients: Database, reports: FileText, transcription: Mic }

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-mist-100 py-3.5 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist-50 text-ink-500">
        <Icon size={16} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-300">{label}</p>
        <p className="break-words text-sm font-medium text-ink-900">{value}</p>
      </div>
    </div>
  )
}

function ScenarioGroup({ title, name, scenarios, value, onChange }) {
  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-semibold text-ink-900">{title}</legend>
      <div className="mt-2 space-y-2">
        {scenarios.map((s) => (
          <label key={s.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${value === s.value ? 'border-nuvia-500 bg-nuvia-50' : 'border-ink-100 hover:border-nuvia-300'}`}>
            <input type="radio" name={name} value={s.value} checked={value === s.value} onChange={() => onChange(s.value)} className="mt-1 accent-nuvia-600" />
            <span>
              <span className="block font-medium text-ink-900">{s.label}</span>
              <span className="block text-xs text-ink-500">{s.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function SettingsPage() {
  const [sim, setSim] = useState(getSimulation)
  const [check, setCheck] = useState({ status: 'idle' })
  const [reset, setReset] = useState(false)
  const services = getServiceStatuses()
  const usesSampleData = [DATA_SOURCE, REPORTS_SOURCE, TRANSCRIPTION_SOURCE].includes('mock')

  async function testConnection() {
    setCheck({ status: 'loading' })
    try {
      setCheck({ status: 'ok', ...(await checkConnection()) })
    } catch (error) {
      setCheck({ status: 'error', error })
    }
  }
  const pick = (key) => (value) => { setSimulation(key, value); setSim(getSimulation()) }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">Configuración</h1>
      <p className="mt-1 text-sm text-ink-500">Conexiones de NUVIA con sus servicios.</p>

      <section aria-labelledby="svc-title" className="mt-6 rounded-xl2 border border-ink-100 bg-white p-5">
        <h2 id="svc-title" className="mb-1 font-display text-base font-bold text-ink-900">Conexiones</h2>
        {services.map((s) => <Row key={s.key} icon={ICONS[s.key]} label={s.label} value={s.detail} />)}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={testConnection} disabled={check.status === 'loading'}>Probar conexión</Button>
          <div role="status" aria-live="polite" className="text-sm">
            {check.status === 'loading' && <span className="inline-flex items-center gap-2 text-ink-500"><Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Probando…</span>}
            {check.status === 'ok' && <span className="inline-flex items-center gap-2 text-nuvia-700"><CheckCircle2 size={15} aria-hidden="true" />{check.source === 'mock' ? 'Los datos de ejemplo responden' : 'El servicio de pacientes responde'} ({check.ms} ms).</span>}
            {check.status === 'error' && <span className="inline-flex items-start gap-2 text-coral-700"><AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{describeError(check.error).title}. {describeError(check.error).detail}</span>}
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-300">Dirección del servidor: {API_BASE_URL}. Formato de datos: {CONTRACT_VERSION}.</p>
      </section>

      {usesSampleData && (
        <section aria-labelledby="sample-title" className="mt-5 rounded-xl2 border border-ink-100 bg-white p-5">
          <h2 id="sample-title" className="font-display text-base font-bold text-ink-900">Datos de ejemplo</h2>
          <p className="mt-1 text-sm text-ink-500">
            Mientras no haya un servidor conectado, NUVIA trabaja con pacientes ficticios. Los reportes, borradores y versiones que guardes se conservan en este navegador.
          </p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => { resetMockReports(); clearRecentPatients(); resetSimulation(); setSim(getSimulation()); setReset(true) }}>
            Restablecer datos de ejemplo
          </Button>
          {reset && <p role="status" className="mt-2 text-sm text-nuvia-700">Datos de ejemplo restablecidos.</p>}

          <details className="mt-5 rounded-xl border border-mist-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink-900">Diagnóstico: simular estados del servidor</summary>
            <p className="mt-2 text-xs text-ink-500">Sirve para comprobar cómo responde la aplicación ante errores. Se pierde al recargar la página.</p>
            {DATA_SOURCE === 'mock' && <ScenarioGroup title="Conexión con el servidor" name="sim-api" scenarios={API_SCENARIOS} value={sim.api} onChange={pick('api')} />}
            {REPORTS_SOURCE === 'mock' && <ScenarioGroup title="Generación de reportes" name="sim-ai" scenarios={AI_SCENARIOS} value={sim.ai} onChange={pick('ai')} />}
            {TRANSCRIPTION_SOURCE === 'mock' && <ScenarioGroup title="Transcripción de audio" name="sim-transcription" scenarios={TRANSCRIPTION_SCENARIOS} value={sim.transcription} onChange={pick('transcription')} />}
          </details>
        </section>
      )}
    </div>
  )
}
