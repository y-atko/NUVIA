// Configuración en TIEMPO DE EJECUCIÓN (no requiere recompilar).
// Este archivo se sirve tal cual en /config.js. Docker puede reemplazarlo
// (volumen, ConfigMap o script de arranque) para apuntar al backend correcto.
//
// IMPORTANTE: es público; cualquiera con el navegador puede leerlo.
// No coloques claves, tokens ni contraseñas aquí.
window.__NUVIA_CONFIG__ = {
  // 'mock' = datos de prueba sin backend | 'api' = backend real
  // DATA_SOURCE: 'mock',

  // Cada servicio se conecta por separado; si no se indica, sigue a DATA_SOURCE.
  // REPORTS_SOURCE: 'mock',        // reportes con IA, borradores, confirmación e historial
  // TRANSCRIPTION_SOURCE: 'mock',  // transcripción de audio

  // Dirección del backend vista DESDE EL NAVEGADOR (no la de red interna de Docker).
  // Puede ser relativa ('/api', recomendada con proxy) o absoluta ('http://localhost:8000/api').
  // API_BASE_URL: '/api',

  // Tiempo máximo de espera por petición, en milisegundos.
  // REQUEST_TIMEOUT_MS: 15000,
  // GENERATION_TIMEOUT_MS: 120000, // generar reporte / transcribir
  // MAX_AUDIO_MB: 25
}
