import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../ui/Button.jsx'
import ReportItem from './ReportItem.jsx'

const HINTS = {
  missing: 'Que un dato no aparezca en el expediente no significa que no exista clínicamente.'
}

export default function ReportSection({ section, editing, dispatch, onOpenSource }) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const headingId = `report-section-${section.key}`

  const add = () => {
    if (!text.trim()) return
    dispatch({ type: 'addItem', sectionKey: section.key, text })
    setText('')
    setAdding(false)
  }

  return (
    <section aria-labelledby={headingId} className="rounded-xl2 border border-ink-100 bg-white p-5 sm:p-6">
      <h3 id={headingId} className="font-display text-base font-bold text-ink-900">
        {section.title} <span className="text-sm font-normal text-ink-300">({section.items.length})</span>
      </h3>
      {HINTS[section.key] && <p className="mt-1 text-xs text-ink-500">{HINTS[section.key]}</p>}

      {section.items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">Sin elementos en esta sección.</p>
      ) : (
        <ul className="mt-2 divide-y divide-mist-100">
          {section.items.map((item) => (
            <ReportItem key={item.id} item={item} sectionKey={section.key} editing={editing} dispatch={dispatch} onOpenSource={onOpenSource} />
          ))}
        </ul>
      )}

      {editing && (
        <div className="mt-3 border-t border-mist-100 pt-3">
          {adding ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                aria-label={`Nuevo elemento en ${section.title}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="Escribe la observación o dato que quieres agregar"
                className="w-full resize-y rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:border-nuvia-500"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={add} disabled={!text.trim()}>Agregar</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setText('') }}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" icon={Plus} onClick={() => setAdding(true)}>
              Agregar a esta sección
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
