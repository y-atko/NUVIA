import React from 'react'
import { initialsOf } from '../../utils/greeting.js'

// Iniciales del paciente. Decorativo: el nombre siempre está escrito al lado.
export default function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-nuvia-50 font-display font-semibold text-nuvia-700 ${sizes[size]}`}
    >
      {initialsOf(name)}
    </span>
  )
}
