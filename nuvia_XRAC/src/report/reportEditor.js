// Lógica de edición del reporte, sin React (se puede probar sola).
//
// Idea: el reporte que viene del backend (`base`) NUNCA se modifica. Las ediciones viven en
// una copia (`sections`, `observations`) que es el "buffer". Mientras el buffer no se guarde,
// es solo un borrador local; guardar lo manda al backend, que devuelve la nueva versión.

const clone = (value) => JSON.parse(JSON.stringify(value))

export function createEditorState(report) {
  return {
    base: report,
    sections: clone(report.sections),
    observations: report.observations,
    nextLocalId: 1
  }
}

function mapItem(sections, sectionKey, itemId, fn) {
  return sections.map((section) =>
    section.key !== sectionKey
      ? section
      : { ...section, items: section.items.map((item) => (item.id === itemId ? fn(item) : item)) }
  )
}

export function editorReducer(state, action) {
  switch (action.type) {
    case 'load': // reemplaza todo (p. ej. tras guardar o confirmar)
      return createEditorState(action.report)

    case 'editItem': {
      const sections = mapItem(state.sections, action.sectionKey, action.itemId, (item) => {
        if (item.authorship === 'professional') return { ...item, text: action.text }
        // Texto generado por IA: se conserva el original la primera vez que se modifica.
        const original = item.originalText ?? item.text
        return { ...item, text: action.text, originalText: original, edited: action.text.trim() !== original.trim() }
      })
      return { ...state, sections }
    }

    case 'addItem': {
      const text = action.text.trim()
      if (!text) return state
      const id = `local-${state.nextLocalId}`
      const item = {
        id,
        text,
        kind: 'statement',
        authorship: 'professional',
        edited: false,
        originalText: null,
        declaredStatus: 'documented',
        displayStatus: 'professional',
        sourceIds: [],
        sources: [],
        unresolvedSourceIds: []
      }
      return {
        ...state,
        nextLocalId: state.nextLocalId + 1,
        sections: state.sections.map((section) =>
          section.key === action.sectionKey ? { ...section, items: [...section.items, item] } : section
        )
      }
    }

    case 'removeItem':
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.key === action.sectionKey
            ? { ...section, items: section.items.filter((item) => item.id !== action.itemId) }
            : section
        )
      }

    case 'setObservations':
      return { ...state, observations: action.text }

    case 'discard': // vuelve a la última versión que tiene el backend
      return createEditorState(state.base)

    case 'replaceContent': // p. ej. "restaurar versión generada por IA": cambia el buffer, no la base
      return {
        ...state,
        sections: clone(action.report.sections),
        observations: action.report.observations,
        nextLocalId: state.nextLocalId
      }

    default:
      return state
  }
}

// Firma comparable del contenido editable (ignora originalText si el texto no está editado).
function signature(sections, observations) {
  return JSON.stringify({
    observations,
    sections: sections.map((section) => ({
      key: section.key,
      items: section.items.map((item) => ({
        id: item.id,
        text: item.text,
        authorship: item.authorship,
        edited: item.edited,
        originalText: item.edited ? item.originalText : null,
        sourceIds: item.sourceIds
      }))
    }))
  })
}

export function isDirty(state) {
  return signature(state.sections, state.observations) !== signature(state.base.sections, state.base.observations)
}

// Elementos que no se pueden guardar (texto vacío).
export function findEmptyItems(state) {
  return state.sections.flatMap((section) =>
    section.items.filter((item) => item.text.trim() === '').map((item) => ({ sectionKey: section.key, itemId: item.id }))
  )
}

// Cuerpo de PUT /reports/{id}/draft. Los ids "local-*" son provisionales: el backend asigna los definitivos.
export function toDraftPayload(state) {
  return {
    baseVersion: state.base.version,
    observations: state.observations,
    sections: state.sections.map((section) => ({
      key: section.key,
      title: section.title,
      items: section.items.map((item) => ({
        id: item.id,
        text: item.text.trim(),
        kind: item.kind,
        authorship: item.authorship,
        edited: item.edited,
        originalText: item.edited ? item.originalText : null,
        status: item.declaredStatus,
        sourceIds: item.sourceIds
      }))
    }))
  }
}

// Qué acciones están permitidas según el estado del reporte.
export function getAvailableActions({ status, dirty, editing, hasAiVersion }) {
  const locked = status === 'confirmed' // un reporte confirmado no se edita
  return {
    canEdit: !locked && !editing,
    canStopEditing: !locked && editing,
    canSave: !locked && dirty,
    canDiscard: !locked && dirty,
    canRestoreAi: !locked && hasAiVersion && (status === 'draft' || dirty),
    canSubmitReview: !locked && status !== 'in_review',
    canConfirm: !locked
  }
}
