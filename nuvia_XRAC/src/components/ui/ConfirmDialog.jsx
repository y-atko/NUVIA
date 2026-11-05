import React from 'react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'

// Pregunta antes de una acción que no se puede deshacer o que descarta trabajo.
export default function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  danger = false, busy = false, onConfirm, onCancel, children
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {description && <p className="text-sm leading-relaxed text-ink-700">{description}</p>}
      {children}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
        <Button variant={danger ? 'dangerSolid' : 'primary'} onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
