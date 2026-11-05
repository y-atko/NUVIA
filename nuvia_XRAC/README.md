# NUVIA

Plataforma de preparación de consultas clínicas. El profesional busca a un paciente, revisa su expediente (cada dato con su fuente),
agrega información de la consulta (observaciones o audio), genera un reporte, lo edita, lo guarda como borrador, lo envía a revisión
y lo confirma. Apoyo para preparar la consulta: no diagnostica ni modifica nunca los registros originales del expediente.

## Ejecutar

Requiere Node.js 18 o superior (probado con Node 22).

```bash
npm ci          # instala dependencias (o npm install)
npm run dev     # http://localhost:5173
npm run build   # genera dist/
npm run preview # sirve dist/
npm test        # pruebas de lógica (sin dependencias extra)
```

Pantallas: Inicio, Pacientes, Expediente y Preparar consulta (`/dashboard/pacientes/:id`), Reportes y Configuración.

## Datos de ejemplo y persistencia local

Mientras no haya un backend conectado, NUVIA trabaja con pacientes ficticios que cumplen el mismo contrato que usará el servidor real.

- Los reportes, borradores, versiones e información de la consulta que se guardan se conservan en `localStorage` del navegador
  (`src/api/mock/mockStore.js`), de modo que sobreviven a una recarga. Lo que no se ha guardado como borrador no se conserva.
- **Esa persistencia solo existe con datos de ejemplo.** Al conectar el servicio real (`REPORTS_SOURCE=api`) el módulo no se ejecuta y
  **no se guarda nada clínico en el navegador**. El editor no cambia: habla siempre con `src/api/reportsApi.js`.
- Para cambiar el almacenamiento de ejemplo, basta con pasar otra implementación a `createPersistence` (misma forma: `load`, `save`, `clear`).
- Configuración → *Restablecer datos de ejemplo* vuelve al estado inicial; *Diagnóstico* permite simular errores del servidor.
- Hoy el reporte lo arma una plantilla local a partir del expediente (sin añadir nada) y así queda rotulado en cada reporte
  (*Generado con: Generador local de NUVIA*). No es un modelo externo. La transcripción automática no existe todavía: sin servicio,
  la interfaz ofrece escribir la transcripción a mano y nunca inventa texto.

## Estados del reporte

`Borrador` (generado o guardado) → `En revisión` → `Confirmado`. Guardar sobre un reporte en revisión lo devuelve a borrador; un reporte
confirmado es de solo lectura. Cada guardado, envío a revisión y confirmación crea una versión que se puede consultar (solo lectura) y
"Restaurar versión original" recupera el contenido generado al inicio (como cambio sin guardar). Los cambios sin guardar viven solo en
memoria y salir del paciente con cambios pendientes pide confirmación. Detalle en `docs/API_CONTRACT_REPORTES.md`.

## Puntos de integración

Las pantallas solo usan `src/api/*Api.js`; nunca el mock ni `fetch`. La forma de las respuestas solo la conocen `normalize.js` y `normalizeReport.js`;
las rutas, `endpoints.js`.

| Servicio | Módulo | Se conecta con | Contrato |
|---|---|---|---|
| Pacientes y expedientes | `patientsApi.js` | `DATA_SOURCE=api` | `docs/API_CONTRACT.md` |
| Información de la consulta, generación, borradores, revisión, confirmación, historial, listado | `consultationApi.js`, `reportsApi.js` | `REPORTS_SOURCE=api` | `docs/API_CONTRACT_REPORTES.md` |
| Transcripción de audio | `transcriptionApi.js` | `TRANSCRIPTION_SOURCE=api` | `docs/API_CONTRACT_REPORTES.md` |

Cada servicio se conecta por separado y, si el backend responde `501`/`404` a una función aún no implementada, la interfaz lo trata con calma
(generación no habilitada, transcripción manual, panel sin reportes). El frontend no reenvía el expediente al generar, no contiene claves y no se
acopla a ningún proveedor del LLM. La autenticación está por definir (la interfaz ya muestra los errores 401 y 403).

Contratos propuestos para backend y preguntas abiertas: `docs/`. Los `docs/example-*.json` se generaron con el propio código.

## Configuración

| Variable | Valores | Por defecto | Para qué |
|---|---|---|---|
| `DATA_SOURCE` | `mock` / `api` | `mock` | Pacientes y expedientes |
| `REPORTS_SOURCE` | `mock` / `api` | = `DATA_SOURCE` | Información de la consulta y reportes |
| `TRANSCRIPTION_SOURCE` | `mock` / `api` | = `DATA_SOURCE` | Transcripción de audio |
| `API_BASE_URL` | ruta o URL | `/api` | Dirección del backend **vista desde el navegador** |
| `REQUEST_TIMEOUT_MS` | número | `15000` | Tiempo máximo por petición |
| `GENERATION_TIMEOUT_MS` | número | `120000` | Generar un reporte o transcribir |
| `MAX_AUDIO_MB` | número | `25` | Tamaño máximo de audio que acepta la interfaz |
| `VITE_DEV_PROXY_TARGET` | URL | (vacío) | Solo `npm run dev`: a dónde reenvía Vite `/api` |

Cada variable se define de dos formas (la primera tiene prioridad):

1. **En ejecución:** `public/config.js` (`window.__NUVIA_CONFIG__ = { DATA_SOURCE: 'api', ... }`). Se sirve como `/config.js`; se puede cambiar o montar sin recompilar.
2. **Al compilar:** con prefijo `VITE_` (`VITE_DATA_SOURCE`, ...) en `.env.local` (ver `.env.example`). Vite las incrusta al compilar: cambiarlas exige recompilar.

Todo es público (está en el navegador): **no pongas claves ni tokens**. El frontend no usa ninguno.

## Docker (notas para Rebeca; no se incluyó ningún Dockerfile ni se tocó configuración de contenedores)

- **El navegador es quien llama a la API**, no el contenedor. `API_BASE_URL` debe ser alcanzable desde el navegador del médico; el nombre interno entre contenedores (`http://backend:8000`) normalmente **no** lo es.
- Opción recomendada: `API_BASE_URL=/api` y que el servidor web del contenedor reenvíe `/api` al backend:
  ```nginx
  client_max_body_size 30m;                                # audios (MAX_AUDIO_MB = 25 por defecto)
  location /api/ { proxy_pass http://backend:8000;         # "backend" = nombre del servicio en compose
                   proxy_read_timeout 130s; }              # generar reporte / transcribir pueden tardar
  location /     { try_files $uri /index.html; }           # necesario para las rutas de React Router
  ```
- Producción: `npm ci && npm run build` y servir `dist/`. Para cambiar fuentes o dirección sin reconstruir la imagen, montar un `config.js` propio en `/config.js`.
- Con `npm run dev` en un contenedor: Vite escucha en `0.0.0.0:5173`; `VITE_DEV_PROXY_TARGET=http://backend:8000` sí es la dirección interna, porque ese reenvío lo hace el contenedor.

## Estructura

```
src/
  api/              config, endpoints, client, normalize / normalizeReport, *Api.js, serviceStatus
    mock/           datos de ejemplo, servicios simulados, persistencia local y estado de simulación
  report/           editor del reporte (reducer, borrador, acciones permitidas) y estados, sin React
  consultation/     información de la consulta (revisión, validación de audio), sin React
  context/          PatientWorkspace: estado del paciente seleccionado (expediente, información, reporte)
  hooks/            useAsync, useReportWorkflow, useConsultationInputs
  components/       ui, dashboard (barra lateral), record (expediente), consultation (reporte)
  pages/dashboard/  Inicio, Pacientes, Reportes, Expediente, Preparar consulta, Configuración
  utils/            fechas (sin inventar), recientes (sessionStorage), rutas, saludo
docs/               contratos de la API y JSON de ejemplo
```

## Pruebas

`npm test` (sin dependencias extra) cubre la normalización (incluida la regla «sin fuente no es respaldado» y el rechazo de reportes de otro paciente),
el cliente HTTP, el editor y los estados del reporte, la información de la consulta y el audio, los servicios simulados con su persistencia
(guardar, recargar, datos corruptos, sin almacenamiento) y la ruta **real** contra un servidor HTTP local: pacientes, reportes, revisión, listado y transcripción multipart.

## Cambios técnicos importantes de esta versión

- Se quitó el lenguaje de prototipo (avisos de datos de prueba, tarjetas de servicios, mensajes técnicos); el estado de las conexiones vive en Configuración.
- Nuevo estado `En revisión` (`POST /reports/{id}/review`) y listado de reportes (`GET /reports`); `patient.details` opcional para la información general.
- Datos de ejemplo coherentes (8 pacientes y reportes en cada estado) con persistencia local intercambiable; los identificadores son `EXP-xxxx`.
- La transcripción sin servicio pasa a ser manual (se eliminó el texto sintético que no correspondía al audio).
- Panel principal, pantalla Reportes, expediente con información general y navegación por secciones, y editor con tres estados.
