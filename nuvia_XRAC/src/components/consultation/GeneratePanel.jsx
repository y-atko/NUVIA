import React, { useState } from 'react'
import { FilePlus2, Loader2 } from 'lucide-react'
import Button from '../ui/Button.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { usePatientWorkspace } from '../../context/PatientWorkspace.jsx'

// Mensajes (honestos y breves) para cada forma en que puede fallar la generación.
const FAILURE_COPY = {
  not_connected: { title: 'La generación de reportes no está habilitada', detail: 'El servidor todavía no ofrece esta función.' },
  unavailable: { title: 'El servicio no está disponible', detail: 'Inténtalo de nuevo en unos minutos.' },
  insufficient: { title: 'Información insuficiente', detail: 'Agrega información de la consulta o revisa que el expediente tenga datos.' },
  error: { title: 'No se pudo generar el reporte', detail: 'Inténtalo de nuevo; si persiste, avisa al equipo técnico.' }
}

function Status({ generation, insufficientLocal, onRetry, onCancel }) {
  const { phase, failure } = generation
  if (phase === 'submitting' || phase === 'generating') {
    return (
      <div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-mist-50 p-3 text-sm text-ink-700">
        <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        {phase === 'submitting' ? 'Enviando la información de la consulta…' : 'Generando el reporte…'}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onCancel}>Cancelar</Button>
      </div>
    )
  }
  if (phase === 'failed' && failure) {
    const copy = FAILURE_COPY[failure.code] || { title: failure.title, detail: failure.detail }
    return (
      <div role="alert" className="mt-4 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm">
        <p className="font-semibold text-amber-700">{copy.title}</p>
        <p className="mt-1 text-ink-700">{copy.detail}</p>
        {failure.code !== 'not_connected' && <Button size="sm" variant="secondary" className="mt-3" onClick={onRetry}>Reintentar</Button>}
      </div>
    )
  }
  if (insufficientLocal) {
    return (
      <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
        <strong className="font-semibold">Información insuficiente.</strong> Este expediente no tiene datos; agrega información de la consulta para generar el reporte.
      </p>
    )
  }
  return null
}

export default function GeneratePanel() {
  const { record, report: wf, consultation } = usePatientWorkspace()
  const [confirmNew, setConfirmNew] = useState(false)

  const data = record.status === 'success' ? record.data : null
  const reviewed = consultation.reviewed
  const insufficientLocal = Boolean(data && data.isEmpty && reviewed.length === 0)
  const working = wf.generation.phase === 'submitting' || wf.generation.phase === 'generating'
  const canGenerate = Boolean(data) && wf.load.status === 'success' && !insufficientLocal && consultation.blocking.length === 0 && !working

  const go = () => wf.generate(reviewed, data ? data.meta.generatedAt : null)
  const onGenerate = () => (wf.report ? setConfirmNew(true) : go())

  return (
    <section aria-labelledby="generate-title" className="rounded-xl2 border border-ink-100 bg-white p-5">
      <h2 id="generate-title" className="font-display text-base font-bold text-ink-900">Reporte</h2>
      <p className="mt-1 text-sm text-ink-500">
        Organiza el expediente y la información de la consulta en un reporte que puedes revisar, editar y confirmar.
      </p>

      <Button size="lg" icon={working ? undefined : FilePlus2} className="mt-4 w-full" onClick={onGenerate} disabled={!canGenerate}>
        {working ? 'Generando…' : wf.report ? 'Generar nuevo reporte' : 'Generar reporte'}
      </Button>

      <Status generation={wf.generation} insufficientLocal={insufficientLocal} onRetry={go} onCancel={wf.cancelGeneration} />

      <ConfirmDialog
        open={confirmNew}
        title="¿Generar un reporte nuevo?"
        description={`Ya existe un reporte para este paciente (versión ${wf.report ? wf.report.version : ''}). El nuevo lo reemplazará como el reporte actual.${wf.dirty ? ' Tienes cambios sin guardar en el reporte actual y se perderán.' : ''}`}
        confirmLabel="Generar nuevo reporte"
        danger={wf.dirty}
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => { setConfirmNew(false); go() }}
      />
    </section>
  )
}
