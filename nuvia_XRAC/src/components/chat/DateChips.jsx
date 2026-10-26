import React from 'react'
import { isoOffset, formatWeekdayShort, formatDayNumber, formatDateLong } from '../../utils/dateHelpers.js'

const UPCOMING_DAYS = 16

export default function DateChips({ selected, onSelect }) {
  const days = Array.from({ length: UPCOMING_DAYS }, (_, i) => isoOffset(i))

  return (
    <div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((iso) => {
          const isSelected = selected === iso
          const isDisabled = selected != null && !isSelected
          return (
            <button
              key={iso}
              disabled={selected != null}
              onClick={() => onSelect(iso)}
              className={`flex w-14 shrink-0 flex-col items-center rounded-xl border py-2.5 transition-all
                ${isSelected ? 'border-nuvia-500 bg-nuvia-50 text-nuvia-700' : 'border-ink-100 bg-white text-ink-700'}
                ${isDisabled ? 'opacity-40' : ''}
                ${selected == null ? 'hover:border-nuvia-400 hover:bg-nuvia-50/60 cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className="text-[11px] font-medium uppercase text-ink-300">{formatWeekdayShort(iso)}</span>
              <span className="mt-0.5 text-base font-semibold">{formatDayNumber(iso)}</span>
            </button>
          )
        })}
      </div>
      {selected && (
        <p className="mt-2 text-xs text-ink-300">Seleccionaste el {formatDateLong(selected)}</p>
      )}
    </div>
  )
}
