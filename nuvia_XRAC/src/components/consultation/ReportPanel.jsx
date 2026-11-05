import React, { useState } from 'react'
import { AlertCircle, BadgeCheck, FileText, Hourglass, History, Pencil, RotateCcw, Save, Send, Undo2, X, Check, FilePen } from 'lucide-react'
import Button from '../ui/Button.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import Modal from '../ui/Modal.jsx'
import { LoadingState, ErrorState, EmptyState } from '../ui/StatusView.jsx'
import ReportStatusBadge from './ReportStatusBadge.jsx'
import ReportView from './ReportView.jsx'
import VersionHistory from './VersionHistory.jsx'
import { getAvailableActions } from '../../report/reportEditor.js'
import { stageOf } from '../../report/reportStatus.js'
import { usePatientWorkspace } from '../../context/PatientWorkspace.jsx'
import { formatDateTime } from '../../utils/dateHelpers.js'

// Botón de solo icono para acciones secundarias (etiqueta accesible y tooltip).
function IconButton({ label, icon: Icon, onClick, disabled, active = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={active || undefined}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'bg-mist-100 text-ink-900' : 'text-ink-500 hover:bg-mist-100 hover:text-ink-900'}`}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  )
}

function StatusBanner({ report }) {
  const stage = stageOf(report.status)
  // "Dra. Núñez, 24 oct 2026, 12:30 p.m." sin dejar un punto doble al final.
  const confirmedBy = [report.confirmedBy, formatDateTime(report.confirmedAt)].filter(Boolean).join(', ').replace(/\.$/, '')
  if (stage === 'confirmed') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl2 border border-nuvia-300 bg-nuvia-50 p-4 text-sm text-nuvia-700">
        <BadgeCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          <strong className="font-semibold">Reporte confirmado.</strong>{' '}
          {confirmedBy ? `${confirmedBy}. ` : ''}Es de solo lectura; para cambiar algo, genera un reporte nuevo.
        </p>
      </div>
    )
  }
  if (stage === 'in_review') {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl2 border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-600">
        <Hourglass size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p><strong className="font-semibold">Reporte en revisión.</strong> Confírmalo cuando lo hayas revisado. Si lo editas, vuelve a ser un borrador.</p>
      </div>
    )
  }
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl2 border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-700">
      <FilePen size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <strong className="font-semibold">Borrador generado automáticamente.</strong> Revisa el contenido y sus fuentes antes de
        confirmarlo. No incluye diagnósticos ni tratamientos.
      </p>
    </div>
  )
}

export default function ReportPanel() {
  const { report: wf, setOpenSource } = usePatientWorkspace()
  const [dialog, setDialog] = useState(null) // 'discard' | 'restore' | 'confirm'
  const [showHistory, setShowHistory] = useState(false)
  const { editor, report, dirty, editing, busy } = wf

  if (wf.load.status === 'loading') return <LoadingState label="Buscando el reporte del paciente…" className="py-16" />
  if (wf.load.status === 'error') return <ErrorState error={wf.load.error} onRetry={wf.reloadReport} />
  if (!report) {
    return (
      <div className="rounded-xl2 border border-dashed border-ink-300 bg-white">
        <EmptyState
          icon={FileText}
          title="Este paciente todavía no tiene un reporte"
          description="Agrega la información de la consulta si la tienes y pulsa «Generar reporte». Aparecerá aquí como borrador."
        />
      </div>
    )
  }

  const confirmed = report.status === 'confirmed'
  const actions = getAvailableActions({ status: report.status, dirty, editing, hasAiVersion: report.generatedVersion !== null })
  const closeDialog = () => setDialog(null)
  const toggleHistory = () => {
    const next = !showHistory
    setShowHistory(next)
    if (next) wf.loadVersions()
  }
  const working = Boolean(busy)

  return (
    <div className="space-y-4">
      {/* Estado y acciones */}
      <div className="sticky top-0 z-10 rounded-xl2 border border-ink-100 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-1 font-display text-base font-bold text-ink-900">Reporte clínico</h2>
          <ReportStatusBadge status={report.status}>
            {stageOf(report.status) === 'confirmed' ? 'Confirmado' : stageOf(report.status) === 'in_review' ? 'En revisión' : 'Borrador'}
            {report.version ? `, versión ${report.version}` : ''}
          </ReportStatusBadge>
          {!confirmed && (
            <span className={`text-xs font-medium ${dirty ? 'text-amber-700' : 'text-ink-300'}`} aria-live="polite">
              {dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'}
            </span>
          )}
          <div className="ml-auto flex gap-0.5">
            {!confirmed && <IconButton label="Descartar cambios" icon={Undo2} onClick={() => setDialog('discard')} disabled={!actions.canDiscard || working} />}
            {!confirmed && <IconButton label="Restaurar versión original" icon={RotateCcw} onClick={() => setDialog('restore')} disabled={!actions.canRestoreAi || working} />}
            <IconButton label="Historial de versiones" icon={History} onClick={toggleHistory} active={showHistory} />
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          {[report.generatedBy && report.generatedBy.label && `Generado con: ${report.generatedBy.label}`, report.updatedAt && `Actualizado: ${formatDateTime(report.updatedAt)}`].filter(Boolean).join('. ')}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {actions.canEdit && <Button size="sm" variant="secondary" icon={Pencil} onClick={() => wf.setEditing(true)} disabled={working}>Editar</Button>}
          {actions.canStopEditing && <Button size="sm" variant="secondary" icon={Check} aria-label="Terminar edición" onClick={() => wf.setEditing(false)}>Listo</Button>}
          {!confirmed && (
            <Button size="sm" variant="secondary" icon={Save} onClick={wf.saveDraft} disabled={!actions.canSave || working}>
              {busy === 'saving' ? 'Guardando…' : 'Guardar borrador'}
            </Button>
          )}
          {!confirmed && actions.canSubmitReview && (
            <Button size="sm" variant="secondary" icon={Send} onClick={wf.submitForReview} disabled={working}>
              {busy === 'submitting' ? 'Enviando…' : 'Enviar a revisión'}
            </Button>
          )}
          {!confirmed && (
            <Button size="sm" icon={BadgeCheck} onClick={() => setDialog('confirm')} disabled={!actions.canConfirm || working}>
              {busy === 'confirming' ? 'Confirmando…' : 'Confirmar reporte'}
            </Button>
          )}
        </div>

        {wf.actionError && (
          <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-coral-50 p-3 text-sm text-coral-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{wf.actionError.title}</p>
              {wf.actionError.detail && <p className="mt-0.5 text-ink-700">{wf.actionError.detail}</p>}
            </div>
            <button type="button" onClick={wf.clearActionError} aria-label="Cerrar aviso" className="shrink-0 hover:opacity-70"><X size={15} aria-hidden="true" /></button>
          </div>
        )}
      </div>

      <StatusBanner report={report} />
      {report.notices.length > 0 && (
        <ul className="space-y-1 rounded-xl2 bg-mist-100 p-4 text-sm text-ink-700">{report.notices.map((n) => <li key={n}>{n}</li>)}</ul>
      )}

      {showHistory && <VersionHistory versions={wf.versions} onRetry={wf.loadVersions} onOpen={wf.openVersion} />}

      <ReportView
        sections={editor.sections}
        observations={editor.observations}
        sources={report.sources}
        editing={editing && !confirmed}
        dispatch={wf.dispatch}
        onOpenSource={setOpenSource}
      />

      <ConfirmDialog
        open={dialog === 'discard'}
        danger
        title="¿Descartar los cambios sin guardar?"
        description="Se perderán las ediciones que no hayas guardado y el reporte volverá a la última versión guardada. Esta acción no se puede deshacer."
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        onCancel={closeDialog}
        onConfirm={() => { wf.discard(); closeDialog() }}
      />
      <ConfirmDialog
        open={dialog === 'restore'}
        danger={dirty}
        title="¿Restaurar la versión original?"
        description={`El contenido actual se reemplazará por el que se generó al inicio (versión ${report.generatedVersion}). Nada se guarda hasta que pulses «Guardar borrador»; si cambias de opinión, puedes descartar el cambio.`}
        confirmLabel="Restaurar versión original"
        onCancel={closeDialog}
        onConfirm={() => { closeDialog(); wf.restoreAi() }}
      />
      <ConfirmDialog
        open={dialog === 'confirm'}
        title="¿Confirmar este reporte?"
        description={`${dirty ? 'Se guardarán tus cambios y se confirmará esa versión. ' : `Se confirmará la versión ${report.version}. `}Quedará como aprobado por ti y ya no se podrá editar. Los registros originales del expediente no se modifican.`}
        confirmLabel="Confirmar reporte"
        onCancel={closeDialog}
        onConfirm={() => { closeDialog(); wf.confirm() }}
      />

      <Modal
        open={Boolean(wf.viewing)}
        onClose={wf.closeVersion}
        width="max-w-3xl"
        title={wf.viewing ? `Versión ${wf.viewing.version} (solo lectura)` : ''}
        subtitle="Así estaba el reporte cuando se guardó esta versión."
      >
        {wf.viewing && wf.viewing.status === 'loading' && <LoadingState label="Cargando versión…" />}
        {wf.viewing && wf.viewing.status === 'error' && <ErrorState error={wf.viewing.error} onRetry={() => wf.openVersion(wf.viewing.version)} />}
        {wf.viewing && wf.viewing.status === 'success' && (
          <ReportView sections={wf.viewing.report.sections} observations={wf.viewing.report.observations} sources={wf.viewing.report.sources} editing={false} dispatch={() => {}} onOpenSource={setOpenSource} />
        )}
      </Modal>
    </div>
  )
}
