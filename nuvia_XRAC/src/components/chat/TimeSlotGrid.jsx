import React from 'react'
import { Clock } from 'lucide-react'

export default function TimeSlotGrid({ slots, selected, onSelect }) {
  if (slots.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-500">
        <Clock size={15} />
        No quedan horarios disponibles ese día. Elige otra fecha.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((slot) => {
        const isSelected = selected === slot
        const isDisabled = selected != null && !isSelected
        return (
          <button
            key={slot}
            disabled={selected != null}
            onClick={() => onSelect(slot)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all
              ${isSelected ? 'border-nuvia-500 bg-nuvia-50 text-nuvia-700' : 'border-ink-100 bg-white text-ink-700'}
              ${isDisabled ? 'opacity-40' : ''}
              ${selected == null ? 'hover:border-nuvia-400 hover:bg-nuvia-50/60 cursor-pointer' : 'cursor-default'}
            `}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}
