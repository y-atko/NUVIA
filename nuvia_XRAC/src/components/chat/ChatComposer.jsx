import React, { useState } from 'react'
import { Send } from 'lucide-react'

export default function ChatComposer({ placeholder, onSubmit, disabled }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-mist-200 bg-white px-4 py-3 sm:px-6">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 rounded-full border border-ink-100 bg-mist-50 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-nuvia-400 focus:bg-white disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nuvia-500 text-white transition-colors hover:bg-nuvia-600 disabled:opacity-30"
        aria-label="Enviar mensaje"
      >
        <Send size={16} strokeWidth={2.25} />
      </button>
    </form>
  )
}
