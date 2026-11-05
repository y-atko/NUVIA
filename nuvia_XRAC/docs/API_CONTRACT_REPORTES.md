# Contrato provisional: información de la consulta, reportes y transcripción (v0.3)

**Estado: PROVISIONAL.** Es lo que el frontend implementa y prueba hoy. **Nada está acordado con backend
(Chinos)** ni conectado: rutas, nombres de campo y códigos hay que confirmarlos. Las rutas viven solo en
`src/api/endpoints.js` y la forma de las respuestas solo en `src/api/normalizeReport.js`, así que cambiarlas no obliga
a tocar las pantallas. Los ejemplos (`docs/example-*.json`) los genera el propio código del frontend con datos ficticios.

Complementa a `API_CONTRACT.md` (pacientes y expediente).

## Reglas que el frontend aplica siempre

1. **Todo reporte es un borrador hasta que el profesional lo confirma.** Un estado desconocido se trata como borrador; solo `confirmed` exacto se muestra como confirmado.
2. **El navegador solo habla con este backend**: nunca con la base de datos ni con el proveedor del LLM. No hay claves en el frontend. No se acopla a ningún proveedor.
3. **El frontend no reenvía el expediente al generar.** Envía el id del paciente y los ids de la información de la consulta; el backend arma la solicitud al modelo desde la base de datos.
4. **Un reporte debe identificar al paciente.** Si `patientId` falta o no coincide con el paciente seleccionado, la respuesta se **rechaza** y no se muestra.
5. **Una afirmación solo es "Respaldada" si cita al menos una fuente que existe en `sources`.** Si no, se muestra "Sin fuente verificable". Excepciones: `kind: "absence"` ("No documentado") y `authorship: "professional"` ("Aportado por el profesional").
6. **Ningún endpoint de este contrato escribe en el expediente original.**
7. **Con el backend conectado el frontend no guarda nada clínico en el navegador.** (Solo con los datos de ejemplo, que no son reales, se usa `localStorage`; ver README.)
8. **El reporte se rotula con lo que lo generó** (`generatedBy.label`, p. ej. el nombre del modelo o del generador). La interfaz lo muestra tal cual en "Generado con:" y no lo llama "IA" por su cuenta.

## Estados del reporte

| Estado del backend | Lo que ve el profesional | Se puede |
|---|---|---|
| `generated` | Borrador | editar, guardar, enviar a revisión, confirmar |
| `draft` | Borrador | editar, guardar, enviar a revisión, confirmar |
| `in_review` | En revisión | editar (al guardar vuelve a `draft`), confirmar |
| `confirmed` | Confirmado | solo lectura; para cambiarlo se genera otro reporte |

Cada transición crea una **versión nueva** (el historial se conserva en backend). Guardar sobre un reporte `in_review` produce una versión `draft`. "Restaurar versión original" se resuelve en el cliente: pide la versión `generatedVersion` y la carga como cambio *sin guardar*.

## Flujo

```
Observaciones / audio ──► (1) POST /transcriptions               solo si hay audio y servicio → texto a revisar
Profesional revisa el texto ► (2) POST /patients/{id}/consultation-inputs                     → ids
"Generar reporte"       ──► (3) POST /patients/{id}/reports   { inputIds }                    → v1 "generated"
Edita (solo local)      ──► (4) PUT  /reports/{id}/draft      { baseVersion, ... }            → "draft"
"Enviar a revisión"     ──► (5) POST /reports/{id}/review     { version }                     → "in_review"
"Confirmar reporte"     ──► (6) POST /reports/{id}/confirm    { version }                     → "confirmed"
Consultas               ──► GET /reports, GET /patients/{id}/reports/latest, GET /reports/{id}/versions[/{n}]
```

## Endpoints (rutas provisionales)

| # | Método y ruta | Para qué | Cuerpo | Respuesta |
|---|---|---|---|---|
| 1 | `POST /transcriptions` | Transcribir un audio | `multipart/form-data`: `patientId`, `audio` | `{ text, language?, durationSec?, provider? }` |
| 2 | `POST /patients/{id}/consultation-inputs` | Registrar la información **ya revisada** | `{ inputs: [{ kind, label, text }] }` | `{ items: [{ id, kind, label, text }] }`, mismo orden |
| 3 | `POST /patients/{id}/reports` | Generar el reporte | `{ inputIds: [], recordGeneratedAt }` | `{ report }` |
| 4 | `GET /patients/{id}/reports/latest` | Último reporte del paciente | — | `{ report }` o `{ report: null }` (404 también se toma como "no hay") |
| 5 | `GET /reports?limit=` | **Último reporte de cada paciente** (panel principal y pantalla Reportes) | — | `{ items: [...], total }` (ver abajo) |
| 6 | `PUT /reports/{id}/draft` | Guardar borrador (nueva versión) | ver abajo | `{ report }` (estado `draft`) |
| 7 | `POST /reports/{id}/review` | Enviar a revisión la versión indicada | `{ version }` | `{ report }` (estado `in_review`) |
| 8 | `POST /reports/{id}/confirm` | Confirmar la versión indicada | `{ version }` | `{ report }` (estado `confirmed`) |
| 9 | `GET /reports/{id}/versions` | Historial | — | `{ items: [{ version, status, savedAt, savedBy, note }] }` |
| 10 | `GET /reports/{id}/versions/{n}` | Una versión concreta (solo lectura) | — | `{ report }` |

El usuario autenticado lo determina el backend (`savedBy`, `confirmedBy` los pone el servidor; el frontend **no envía identidad**). La autenticación (cookie o token) **está por definir**.

### 1. Transcripción
- Si el servicio no existe (`501`, `404` o `405`), la interfaz **no muestra ningún error**: ofrece escribir o pegar la transcripción a mano. Nunca se inventa texto.
- El texto (automático o escrito a mano) se muestra editable y **solo se usa tras marcarlo como revisado**.
- Respuesta síncrona; si tarda, conviene `202` + consulta posterior (pregunta abierta nº 5).

### 2. Información de la consulta (`example-inputs-request.json`)
`kind`: `input` (observaciones del profesional) o `transcription` (transcripción revisada). Sin información no se hace esta llamada. El backend la guarda y devuelve **ids**, que luego aparecen como fuentes del reporte (`kind` `input` / `transcription`).

### 3. Generar (`example-generate-request.json`)
| Situación | HTTP | `error.code` | Qué muestra la interfaz |
|---|---|---|---|
| Aún no implementado | `501` (o `404`/`405`) | `not_implemented` | "La generación de reportes no está habilitada" |
| Servicio caído o saturado | `503` | `ai_unavailable` | "El servicio no está disponible" + reintentar |
| Falta información | `422` | `insufficient_information` | "Información insuficiente" + reintentar |
| Sin sesión / sin permiso | `401` / `403` | — | "Sesión no válida" / "No tienes permiso" |
| Fallo del modelo u otro | `5xx` | `generation_failed` | "No se pudo generar el reporte" + reintentar |
| No hay comunicación | red / tiempo agotado | — | "No se pudo conectar con el servidor" + reintentar |

Formato de error recomendado: `{ "error": { "code": "...", "message": "texto para el usuario" } }`. Espera máxima del frontend al generar o transcribir: 120 s (`GENERATION_TIMEOUT_MS`).

### 5. Listado de reportes (`example-reports-list.json`)
Un elemento por paciente (su reporte más reciente): `{ id, patientId, patientLabel, status, version, updatedAt, confirmedAt, confirmedBy }`. Con ellos se calculan los conteos (Borradores / En revisión / Confirmados) y las listas del panel. Si el backend responde `404`/`405`/`501`, el panel se muestra vacío, sin error.

### 6. Guardar borrador (`example-draft-request.json`)
- `baseVersion` = versión que se está editando. Si ya no es la última ⇒ `409` con `error.code = "version_conflict"` (el frontend conserva los cambios locales y lo avisa).
- Los elementos nuevos llegan con `id` que empieza por `local-`: **el backend asigna el id definitivo** y lo devuelve.
- `originalText` solo viaja si `edited` es `true`. `sourceIds` se reenvía tal cual.
- Reporte ya confirmado ⇒ `409` con `error.code = "report_confirmed"` (también en 7 y 8).

### 7 y 8. Revisión y confirmación (`example-review-request.json`)
`{ "version": N }` = la versión que se pasa de estado. Si hay cambios sin guardar, el frontend guarda primero el borrador y envía **esa** versión. Un conflicto de versión responde `409`.

## El objeto `report` (`example-report-*.json`)

| Campo | Obligatorio | Notas |
|---|---|---|
| `id`, `patientId` | **Sí** | Sin `id` se rechaza; `patientId` debe coincidir con el paciente seleccionado. |
| `status` | **Sí** | `generated`, `draft`, `in_review`, `confirmed`. |
| `version`, `generatedVersion` | Recomendado | Sin `generatedVersion` no se ofrece "Restaurar versión original". |
| `generatedBy` | No | `{ label, model }`, informativo. |
| `createdAt`, `updatedAt`, `confirmedAt`, `confirmedBy` | No | ISO 8601 y nombre a mostrar. |
| `observations`, `notices` | No | Observaciones del profesional; avisos de texto sobre el reporte. |
| `sections[]` | **Sí** | `{ key, title, items[] }`; el backend decide qué secciones y su orden. |
| `sources[]` | **Sí** | Como en `API_CONTRACT.md`, más `kind` y `label`. |

Secciones sugeridas (`key`): `summary` Resumen clínico, `background` Antecedentes relevantes, `history` Historial y evolución, `recent` Información reciente, `missing` Datos faltantes, `contradictions` Posibles contradicciones, `review` Aspectos que requieren revisión. "Fuentes de información" se arma con `sources[]`.

**Elemento** `{ id, text, status, sourceIds, kind?, authorship?, edited?, originalText? }`

| Campo | Valores | Efecto en pantalla |
|---|---|---|
| `status` | `documented` / `needs_review` | Respaldado / Por revisar (solo con fuente). |
| `kind` | `statement` (defecto) / `absence` | `absence` = "no consta en el expediente": se muestra "No documentado" y no necesita fuente. |
| `authorship` | `ai` (defecto) / `professional` | `professional` = lo agregó el profesional. |
| `edited` | boolean | Etiqueta "Editado" y enlace "Ver el texto original" (con `originalText`). |
| `sourceIds` | ids de `sources[]` | Un id inexistente se muestra como "Referencia no encontrada". |

**Fuente** `{ id, kind, table, recordId, date, field, excerpt, label }`: `kind` = `record` (por defecto; registro del expediente), `input` (observaciones del profesional) o `transcription` (audio transcrito y revisado). Estas dos últimas se muestran como "Información de la consulta", **distintas de lo documentado**: así se distingue lo documentado, lo introducido, lo transcrito y lo generado.

## Puntos de integración pendientes

**LLM (Gemini, OpenRouter u otro):** implementar en backend los endpoints 3 a 10 y construir el prompt desde la base de datos; devolver el reporte **ya estructurado** con `sourceIds` verificables (el frontend no interpreta texto libre del modelo); omitir o marcar como `needs_review` lo que no se pueda respaldar; prohibir diagnósticos y tratamientos en el prompt; rotular `generatedBy`. Cambiar de proveedor no debe cambiar este contrato. Conectar: `REPORTS_SOURCE=api`.

**Transcripción:** implementar el endpoint 1 con el proveedor elegido; definir formatos, tamaño, duración y retención del audio (el frontend no lo conserva). Conectar: `TRANSCRIPTION_SOURCE=api`.

## Preguntas abiertas para backend (Chinos)

1. ¿Rutas, verbos y prefijo definitivos? ¿Versionado?
2. ¿Cómo se autentica el profesional y se propaga a estas llamadas? ¿Qué texto mostrar en `confirmedBy`?
3. ¿Quién garantiza que cada `sourceId` exista en `sources`?
4. ¿Generación y transcripción son síncronas o `202` + consulta posterior?
5. Al generar un reporte nuevo, ¿el anterior se archiva o se reemplaza?
6. ¿Quién puede confirmar un reporte `in_review`: el mismo profesional u otro? ¿Hace falta un rol de revisor?
7. ¿Se puede editar la información de la consulta ya enviada o solo agregar nueva?
8. ¿Política de retención de audio, textos introducidos y borradores?
