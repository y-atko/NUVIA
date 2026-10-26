import React from 'react'
import { Check } from 'lucide-react'

// Renders a row/grid of choice buttons inside a chat bubble. Once a value has
// been picked (message.selected is set), buttons freeze in a read-only state
// so the transcript still reads correctly when scrolling back up.
export default function OptionList({ options, selected, onSelect, columns = 1 }) {
  const gridClass = columns === 2 ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'

  return (
    <div className={gridClass}>
      {options.map((opt) => {
        const isSelected = selected === opt.value
        const isDisabled = selected != null && !isSelected
        return (
          <button
            key={opt.value}
            disabled={selected != null}
            onClick={() => onSelect(opt.value)}
            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all
              ${isSelected ? 'border-nuvia-500 bg-nuvia-50 text-nuvia-700' : 'border-ink-100 bg-white text-ink-700'}
              ${isDisabled ? 'opacity-40' : ''}
              ${selected == null ? 'hover:border-nuvia-400 hover:bg-nuvia-50/60 cursor-pointer' : 'cursor-default'}
            `}
          >
            <span className="flex items-center gap-2">
              {opt.icon && <opt.icon size={15} strokeWidth={2.25} />}
              {opt.label}
            </span>
            {isSelected && <Check size={15} className="text-nuvia-600" strokeWidth={2.5} />}
          </button>
        )
      })}
    </div>
  )
}
