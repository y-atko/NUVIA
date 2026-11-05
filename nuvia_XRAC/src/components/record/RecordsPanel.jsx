import React from 'react'
import { ChevronDown } from 'lucide-react'
import { formatDisplayDate } from '../../utils/dateHelpers.js'

function groupByTable(records) {
  const groups = new Map()
  records.forEach((record) => {
    const key = record.table || 'Sin tabla indicada'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(record)
  })
  return [...groups.entries()]
}

// Registros originales tal como llegaron, sin interpretar.
export default function RecordsPanel({ records }) {
  return (
    <section id="records" aria-labelledby="records-title" className="scroll-mt-16 rounded-xl2 border border-ink-100 bg-white p-5 sm:p-6">
      <h2 id="records-title" className="text-base font-semibold text-ink-900">
        Registros originales <span className="text-sm font-normal text-ink-300">({records.length})</span>
      </h2>
      <p className="mt-1 text-sm text-ink-500">Los datos tal como llegaron del expediente, sin interpretar.</p>

      {records.length === 0 ? (
        <p className="mt-4 rounded-lg bg-mist-50 px-4 py-3 text-sm text-ink-500">
          El backend no proporcionó los registros originales de este expediente.
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {groupByTable(records).map(([table, items]) => (
            <details key={table} className="group rounded-xl border border-mist-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-ink-900">
                <span className="truncate">{table}</span>
                <span className="flex shrink-0 items-center gap-2 font-normal text-ink-300">
                  {items.length} {items.length === 1 ? 'registro' : 'registros'}
                  <ChevronDown size={15} aria-hidden="true" className="transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <div className="divide-y divide-mist-100 border-t border-mist-200">
                {items.map((record, index) => (
                  <div key={`${record.recordId}-${index}`} className="px-4 py-3">
                    <p className="text-xs text-ink-500">
                      <span className="font-medium text-ink-700">{record.recordId || 'Sin identificador'}</span>
                      {record.date && <span className="ml-2">{formatDisplayDate(record.date)}</span>}
                    </p>
                    {record.fields.length === 0 ? (
                      <p className="mt-2 text-sm text-ink-300">Registro sin campos.</p>
                    ) : (
                      <dl className="mt-2 grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-1.5 text-sm">
                        {record.fields.map((field) => (
                          <React.Fragment key={field.label}>
                            <dt className="truncate text-ink-300" title={field.label}>{field.label}</dt>
                            <dd className={field.value ? 'break-words text-ink-900' : 'text-ink-300'}>
                              {field.value || '(vacío)'}
                            </dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}
