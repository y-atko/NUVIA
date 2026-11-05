import React from 'react'
import Badge from '../ui/Badge.jsx'

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// Resumen de una línea de lo que requiere atención; cada chip lleva a su detalle.
export default function StatusStrip({ counts, firstUnverifiedClaimId, onJump }) {
  const chips = [
    counts.contradiction > 0 && {
      tone: 'contradiction',
      text: plural(counts.contradiction, 'contradicción', 'contradicciones'),
      target: 'alerts'
    },
    counts.review > 0 && { tone: 'review', text: `${counts.review} por revisar`, target: 'alerts' },
    counts.missing > 0 && {
      tone: 'missing',
      text: plural(counts.missing, 'dato no documentado', 'datos no documentados'),
      target: 'alerts'
    },
    counts.unverifiedClaims > 0 && {
      tone: 'unverified',
      text: plural(counts.unverifiedClaims, 'afirmación sin fuente verificable', 'afirmaciones sin fuente verificable'),
      target: firstUnverifiedClaimId ? `claim-${firstUnverifiedClaimId}` : 'alerts'
    }
  ].filter(Boolean)

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Resumen de alertas">
      {chips.length === 0 ? (
        <p className="text-sm text-ink-500">El sistema no reportó alertas ni afirmaciones sin fuente.</p>
      ) : (
        chips.map((chip) => (
          <button
            key={chip.tone}
            type="button"
            onClick={() => onJump(chip.target)}
            className="rounded-full focus-visible:outline-offset-4"
          >
            <Badge tone={chip.tone}>{chip.text}</Badge>
          </button>
        ))
      )}
    </div>
  )
}
