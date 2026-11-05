import React from 'react'
import { Loader2, AlertCircle, SearchX, RefreshCw } from 'lucide-react'
import Button from './Button.jsx'
import { describeError } from '../../api/client.js'

// Los tres estados que toda pantalla con datos remotos debe poder mostrar.

export function LoadingState({ label = 'Cargando…', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-2.5 py-12 text-sm text-ink-500 ${className}`}>
      <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorState({ error, onRetry, className = '' }) {
  const { title, detail } = describeError(error)
  return (
    <div role="alert" className={`rounded-xl2 border border-coral-500/30 bg-coral-50 p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-coral-700" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-coral-700">{title}</p>
          {detail && <p className="mt-1 text-sm text-ink-700">{detail}</p>}
          {onRetry && (
            <Button variant="secondary" size="sm" icon={RefreshCw} className="mt-3" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon = SearchX, title, description, children, className = '' }) {
  return (
    <div className={`flex flex-col items-center px-6 py-10 text-center ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist-100 text-ink-300">
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
