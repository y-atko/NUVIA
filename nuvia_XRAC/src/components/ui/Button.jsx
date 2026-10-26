import React from 'react'

const VARIANTS = {
  primary: 'bg-nuvia-500 text-white hover:bg-nuvia-600 shadow-sm shadow-nuvia-500/20',
  secondary: 'bg-white text-ink-700 border border-ink-100 hover:border-nuvia-300 hover:text-nuvia-700',
  ghost: 'bg-transparent text-ink-500 hover:bg-mist-100 hover:text-ink-700',
  danger: 'bg-white text-coral-500 border border-coral-500/30 hover:bg-red-50',
  dangerSolid: 'bg-coral-500 text-white hover:bg-[#C94C42]'
}

const SIZES = {
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-5 py-3 rounded-xl gap-2'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={16} strokeWidth={2.25} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={16} strokeWidth={2.25} />}
    </button>
  )
}
