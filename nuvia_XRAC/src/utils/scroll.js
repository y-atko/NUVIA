// Desplaza la vista hasta un elemento por id, respetando "reducir movimiento".
export function scrollToId(id, block = 'center') {
  const el = document.getElementById(id)
  if (!el) return
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block })
}
