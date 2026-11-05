import React from 'react'

const formatAge = (age) => (age && /^\d+$/.test(age) ? `${age} años` : age)

// Información general del paciente: solo lo que el backend entrega (nada se rellena).
export default function GeneralInfo({ patient }) {
  const facts = [
    patient.age && { label: 'Edad', value: formatAge(patient.age) },
    patient.sex && { label: 'Sexo', value: patient.sex },
    ...patient.identifiers.map((i) => ({ label: i.label, value: i.value })),
    ...patient.details
  ].filter(Boolean)
  if (facts.length === 0) return null

  return (
    <section aria-labelledby="general-title" className="rounded-xl2 border border-ink-100 bg-white p-5">
      <h2 id="general-title" className="font-display text-base font-bold text-ink-900">Información general</h2>
      <dl className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-x-6 gap-y-3">
        {facts.map((fact, i) => (
          <div key={`${fact.label}-${i}`} className="min-w-0">
            <dt className="text-xs text-ink-300">{fact.label}</dt>
            <dd className="truncate text-sm font-medium text-ink-900" title={fact.value}>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
