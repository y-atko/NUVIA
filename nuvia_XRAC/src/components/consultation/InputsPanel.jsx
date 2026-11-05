import React, { useRef } from 'react'
import { AlertCircle, Check, Loader2, Mic, Replace, Trash2, Upload } from 'lucide-react'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import { usePatientWorkspace } from '../../context/PatientWorkspace.jsx'
import { MAX_AUDIO_MB } from '../../api/config.js'
import { formatFileSize } from '../../consultation/inputs.js'

const ReviewBadge = ({ reviewed }) => (reviewed ? <Badge tone="documented">Revisado</Badge> : <Badge tone="review">Sin revisar</Badge>)
const textarea = 'w-full resize-y rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-sm leading-relaxed text-ink-900 placeholder:text-ink-300 focus:border-nuvia-500'

function ReviewRow({ reviewed, enabled, onToggle, doneLabel, todoLabel }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {enabled && <ReviewBadge reviewed={reviewed} />}
      {enabled && (
        <Button size="sm" variant={reviewed ? 'ghost' : 'secondary'} icon={reviewed ? undefined : Check} onClick={onToggle}>
          {reviewed ? doneLabel : todoLabel}
        </Button>
      )}
    </div>
  )
}

function TextInput({ inputs, dispatch }) {
  const hasText = inputs.text.trim().length > 0
  return (
    <div>
      <label htmlFor="consulta-texto" className="text-sm font-semibold text-ink-900">Observaciones de la consulta</label>
      <textarea
        id="consulta-texto"
        value={inputs.text}
        onChange={(e) => dispatch({ type: 'setText', text: e.target.value })}
        rows={5}
        placeholder="Lo que el paciente refiere o lo que observas. Se identificará como información de la consulta."
        className={`mt-2 ${textarea}`}
      />
      <ReviewRow
        reviewed={inputs.textReviewed}
        enabled={hasText}
        onToggle={() => dispatch({ type: 'setTextReviewed', reviewed: !inputs.textReviewed })}
        todoLabel="Marcar como revisado"
        doneLabel="Quitar revisión"
      />
    </div>
  )
}

function TranscriptBlock({ consultation }) {
  const { inputs, dispatch, transcribe } = consultation
  const t = inputs.transcript

  if (t.status === 'sending') {
    return (
      <p role="status" className="mt-3 flex items-center gap-2 text-sm text-ink-500">
        <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Transcribiendo el audio…
      </p>
    )
  }
  if (t.status === 'error') {
    return (
      <div role="alert" className="mt-3 rounded-xl bg-coral-50 p-3 text-sm text-coral-700">
        <p className="flex items-center gap-2 font-semibold"><AlertCircle size={15} aria-hidden="true" /> No se pudo transcribir el audio</p>
        <p className="mt-1 text-ink-700">{t.error}.</p>
        <Button size="sm" variant="secondary" className="mt-3" onClick={transcribe}>Reintentar</Button>
      </div>
    )
  }
  if (t.status === 'ready' || t.status === 'manual') {
    return (
      <div className="mt-3">
        <label htmlFor="consulta-transcripcion" className="text-sm font-semibold text-ink-900">Transcripción</label>
        <p className="mt-0.5 text-xs text-ink-500">
          {t.status === 'manual'
            ? 'La transcripción automática no está disponible. Escribe o pega aquí lo que dice el audio.'
            : 'Revisa y corrige el texto antes de usarlo.'}
        </p>
        {t.isSynthetic && <p className="mt-1 text-xs font-medium text-amber-700">Este texto no corresponde al contenido del audio.</p>}
        <textarea id="consulta-transcripcion" value={t.text} onChange={(e) => dispatch({ type: 'setTranscript', text: e.target.value })} rows={5} className={`mt-2 ${textarea}`} />
        <ReviewRow
          reviewed={t.reviewed}
          enabled={t.text.trim().length > 0}
          onToggle={() => dispatch({ type: 'setTranscriptReviewed', reviewed: !t.reviewed })}
          todoLabel="Marcar como revisada"
          doneLabel="Quitar revisión"
        />
      </div>
    )
  }
  return null
}

function AudioInput({ consultation }) {
  const { inputs, previewUrl, selectAudio, removeAudio, transcribe } = consultation
  const fileInput = useRef(null)
  const sending = inputs.transcript.status === 'sending'
  const extension = inputs.audio ? (inputs.audio.name.split('.').pop() || '').toUpperCase() : ''

  const onPick = (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (file) selectAudio(file)
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink-900">Audio</p>
      <input ref={fileInput} type="file" accept="audio/*,.m4a,.mp3,.wav,.ogg,.opus,.aac,.flac" onChange={onPick} aria-label="Archivo de audio" className="sr-only" />

      {!inputs.audio ? (
        <button
          type="button"
          onClick={() => fileInput.current.click()}
          className="mt-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-ink-300 px-4 py-4 text-left transition-colors hover:border-nuvia-500 hover:bg-nuvia-50"
        >
          <Upload size={18} className="shrink-0 text-ink-500" aria-hidden="true" />
          <span>
            <span className="block text-sm font-medium text-ink-900">Seleccionar archivo de audio</span>
            <span className="block text-xs text-ink-500">MP3, M4A, WAV u OGG, hasta {MAX_AUDIO_MB} MB</span>
          </span>
        </button>
      ) : (
        <div className="mt-2 rounded-xl border border-ink-100 p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nuvia-50 text-nuvia-600">
              <Mic size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900" title={inputs.audio.name}>{inputs.audio.name}</p>
              <p className="text-xs text-ink-500">{[extension && `Formato ${extension}`, formatFileSize(inputs.audio.size)].filter(Boolean).join(', ')}</p>
            </div>
          </div>
          {previewUrl && <audio controls src={previewUrl} className="mt-3 w-full" aria-label="Escuchar el audio" />}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={transcribe} disabled={sending}>Transcribir</Button>
            <Button size="sm" variant="secondary" icon={Replace} onClick={() => fileInput.current.click()} disabled={sending}>Reemplazar</Button>
            <Button size="sm" variant="danger" icon={Trash2} onClick={removeAudio}>Eliminar</Button>
          </div>
          <TranscriptBlock consultation={consultation} />
        </div>
      )}

      {inputs.audioError && (
        <p role="alert" className="mt-2 flex items-start gap-2 text-sm text-coral-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {inputs.audioError}
        </p>
      )}
    </div>
  )
}

export default function InputsPanel() {
  const { consultation } = usePatientWorkspace()
  const used = consultation.reviewed
  return (
    <section aria-labelledby="inputs-title" className="rounded-xl2 border border-ink-100 bg-white p-5">
      <h2 id="inputs-title" className="font-display text-base font-bold text-ink-900">Información de la consulta</h2>
      <div className="mt-4 space-y-5">
        <TextInput inputs={consultation.inputs} dispatch={consultation.dispatch} />
        <hr className="border-mist-100" />
        <AudioInput consultation={consultation} />
      </div>

      {used.length > 0 && (
        <p className="mt-5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
          Se incluirá en el reporte:
          {used.map((u) => <Badge key={u.kind} tone="documented">{u.kind === 'transcription' ? 'Transcripción' : 'Observaciones'}</Badge>)}
        </p>
      )}
      {consultation.blocking.map((problem) => (
        <p key={problem} role="alert" className="mt-4 flex items-start gap-2 text-sm text-amber-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {problem}
        </p>
      ))}
      {consultation.notices.map((notice) => (
        <p key={notice} className="mt-3 text-xs text-ink-500">{notice}</p>
      ))}
    </section>
  )
}
