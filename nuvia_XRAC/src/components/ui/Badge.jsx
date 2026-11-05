import React from 'react'
import {
  CheckCircle2, Eye, CircleDashed, MinusCircle, AlertTriangle,
  Pencil, UserCheck, BadgeCheck, FileText, FilePen, Hourglass
} from 'lucide-react'

// Etiquetas de estado. Cada tono tiene color, icono y texto: el significado
// nunca depende solo del color.
export const TONES = {
  documented: { label: 'Respaldado', icon: CheckCircle2, cls: 'bg-nuvia-50 text-nuvia-700' },
  review: { label: 'Por revisar', icon: Eye, cls: 'bg-amber-50 text-amber-700' },
  unverified: {
    label: 'Sin fuente verificable',
    icon: CircleDashed,
    cls: 'border border-dashed border-ink-300 bg-white text-ink-500'
  },
  missing: { label: 'No documentado', icon: MinusCircle, cls: 'bg-mist-100 text-ink-700' },
  contradiction: { label: 'Contradicción', icon: AlertTriangle, cls: 'bg-coral-50 text-coral-700' },
  // Autoría del contenido del reporte
  edited: { label: 'Editado', icon: Pencil, cls: 'bg-amber-50 text-amber-700' },
  professional: { label: 'Aportado por el profesional', icon: UserCheck, cls: 'bg-nuvia-50 text-nuvia-700' },

  // Estado del reporte: Borrador, En revisión, Confirmado (y la versión inicial del historial)
  draft: { label: 'Borrador', icon: FilePen, cls: 'bg-amber-50 text-amber-700' },
  in_review: { label: 'En revisión', icon: Hourglass, cls: 'bg-sky-500/10 text-sky-600' },
  confirmed: { label: 'Confirmado', icon: BadgeCheck, cls: 'bg-nuvia-50 text-nuvia-700' },
  initial: { label: 'Versión inicial', icon: FileText, cls: 'bg-mist-100 text-ink-700' }
}

// Estado que calcula la interfaz para una afirmación -> tono de la etiqueta.
export const CLAIM_TONE = {
  documented: 'documented',
  needs_review: 'review',
  unverified: 'unverified',
  missing: 'missing',
  professional: 'professional'
}

export default function Badge({ tone = 'documented', children, className = '' }) {
  const meta = TONES[tone] || TONES.review
  const Icon = meta.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls} ${className}`}
    >
      <Icon size={13} strokeWidth={2.25} aria-hidden="true" />
      {children ?? meta.label}
    </span>
  )
}
