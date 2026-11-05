// Estados del reporte tal como los ve el profesional: Borrador, En revisión y Confirmado.
// El backend puede enviar además 'generated' (recién generado, sin ediciones): para el
// profesional sigue siendo un borrador.
export const STAGES = {
  draft: { label: 'Borrador', tone: 'draft' },
  in_review: { label: 'En revisión', tone: 'in_review' },
  confirmed: { label: 'Confirmado', tone: 'confirmed' }
}

export const stageOf = (status) => (status === 'confirmed' ? 'confirmed' : status === 'in_review' ? 'in_review' : 'draft')
export const stageLabel = (status) => STAGES[stageOf(status)].label
// Pendiente de revisión = todavía no confirmado.
export const isPending = (status) => stageOf(status) !== 'confirmed'
