# Contrato provisional de la API: pacientes y expediente (v0.3)

**Estado: PROVISIONAL.** Es lo que el frontend espera hoy. Nada está acordado con backend
(Chinos) ni basado todavía en el SQL real: rutas, nombres de campo y valores hay que
confirmarlos. Los ejemplos completos están en `example-patients.json` y `example-record.json`
(datos 100 % ficticios). Los reportes, la información de la consulta y la transcripción están en
`API_CONTRACT_REPORTES.md`.

Principios que el frontend aplica sobre cualquier respuesta:

- Si falta un campo, la pantalla lo dice ("No informado", "No hay datos disponibles"); nunca lo rellena.
- Una afirmación solo se muestra **Respaldada** si al menos una de sus `sourceIds` existe en `sources`.
  Sin fuente, o con ids que no existen, se muestra **Sin fuente verificable** aunque `status` diga `documented`.
- Las fechas son texto. Solo se reformatea `YYYY-MM-DD` válido; cualquier otro formato se muestra tal cual.
- Una alerta de tipo desconocido se muestra como "Por revisar"; nunca se oculta.

## Endpoints (rutas provisionales; viven en `src/api/endpoints.js`)

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/patients?q=<texto>&limit=<n>` | Buscar pacientes. `q` vacío = listado. |
| GET | `/patients/{id}/record` | Expediente resumido de un paciente. |

La dirección base la define `API_BASE_URL` (por defecto `/api`). Errores: `404` en `/record` = paciente
inexistente; cualquier `5xx` o fallo de red se muestra con opción de reintentar.

## `GET /patients`

```json
{ "items": [ { "id": "TEST-001", "label": "Paciente de prueba A", "age": 54, "sex": "F",
               "lastRecordDate": "2026-09-05", "note": null } ],
  "total": 5 }
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `items[].id` | **Sí** | Identificador opaco del paciente (se usa en la URL). Sin `id` el elemento se descarta. |
| `items[].label` | No | Texto a mostrar. Si falta se muestra el `id`. |
| `age`, `sex`, `lastRecordDate` | No | Texto o número; se muestra tal cual. Si ningún paciente trae `lastRecordDate`, la columna se oculta. |
| `note` | No | Texto auxiliar bajo el nombre (en las pruebas indica el escenario). |
| `total` | No | Solo si es número. Si falta, el panel principal muestra "—" (no se supone). |

## `GET /patients/{id}/record`

```json
{
  "meta":    { "contractVersion": "0.1-provisional", "isTestData": true, "generatedAt": "...",
               "summaryOrigin": "texto", "notes": null },
  "patient": { "id": "...", "label": "...", "age": 67, "sex": "M",
               "identifiers": [ { "label": "Expediente", "value": "..." } ] },
  "summary": { "sections": [ { "key": "medicamentos", "title": "Medicamentos e indicaciones",
      "items": [ { "id": "c-c2", "text": "...", "status": "needs_review", "date": "2025-06-02",
                   "sourceIds": ["c-s1"] } ] } ] },
  "alerts":  [ { "id": "c-al1", "type": "contradiction", "title": "...", "description": "...",
                 "claimIds": ["c-c2", "c-c3"], "sourceIds": ["c-s1", "c-s2"] } ],
  "sources": [ { "id": "c-s1", "table": "historiaclinica", "recordId": "TEST-HC-0021",
                 "date": "2025-06-02", "field": "MedicamentosActuales", "excerpt": "texto citado" } ],
  "records": [ { "table": "historiaclinica", "recordId": "TEST-HC-0021", "date": "2025-06-02",
                 "fields": { "MedicamentosActuales": "..." } } ]
}
```

### Qué es obligatorio

| Campo | Obligatorio | Qué hace el frontend si falta |
|---|---|---|
| `patient.id` | Recomendado | Usa el id de la URL. |
| `summary.sections[].items[].text` | **Sí** | Muestra "Elemento sin texto". |
| `summary.sections[].items[].sourceIds` | **Sí, para que el dato cuente como respaldado** | El dato queda "Sin fuente verificable". |
| `sources[].id` | **Sí** | La fuente se descarta (no se puede referenciar). |
| `patient.details[]` | No | `{ label, value }` para la tarjeta "Información general" (p. ej. servicio, último ingreso). Solo se muestra lo que llega. |
| `sources[].kind` | No | `record` (por defecto), `input` o `transcription` (solo se usan en reportes). |
| Todo lo demás | No | Se omite o se muestra "No informado". |

### Valores permitidos

| Campo | Valores | Significado en pantalla |
|---|---|---|
| `items[].status` | `documented` / `needs_review` | Respaldado / Por revisar. Otro valor o ausente se trata como `needs_review`. |
| `alerts[].type` | `missing` / `contradiction` / `review` | No documentado / Contradicción / Por revisar. |

- `missing` = el dato **no está en el expediente** (no implica que no exista clínicamente).
- `contradiction` = dos registros se oponen. Diferencias que pueden ser de momentos clínicos
  distintos (p. ej. dos pesos en fechas distintas) conviene enviarlas como `review`.
- `sections[]`: el backend decide qué secciones envía y su orden. `key` solo elige el icono
  (`motivo`, `antecedentes`, `diagnosticos`, `medicamentos`, `signos_estudios`, `evolucion`).
- `alerts[].claimIds` permite el enlace "Ver en el resumen"; `sourceIds` muestra los registros implicados.
- `sources[].table` / `recordId` / `field` son **texto libre** para el frontend. Los nombres de los
  ejemplos vienen del diccionario de datos solo como ilustración.
- `records[]` es opcional: si una fuente coincide por `table` + `recordId` con un registro de aquí,
  el detalle muestra el registro completo; si no, solo la referencia y el fragmento.
- Un campo vacío de `records[].fields` se muestra como "(vacío)", sin interpretarlo.

## Preguntas abiertas para backend (Chinos)

1. ¿Rutas, parámetros y prefijo definitivos? ¿Búsqueda por qué campos (Expediente, Nombre…)?
2. ¿Qué es `patient.id`: `Expediente`? ¿Es estable entre tablas y está anonimizado de forma consistente? (Si `patient.id` llega y no coincide con el de la URL, el frontend rechaza la respuesta.)
3. ¿Qué identifica una fuente: `table` + `recordId` (¿`Indice`?)? ¿Las tablas sin `Expediente`
   (`RecetasDet`, `hosdcr`) cómo se enlazan, solo por `ClaveIngreso`?
4. ¿Quién genera `alerts` y con qué reglas? ¿Se puede distinguir `contradiction` de `review`?
5. ¿Habrá `records` (registros originales) o solo `sources` con fragmento?
6. ¿Paginación del listado (`total`, `limit`, `offset`)? ¿Tamaño típico de un expediente?
7. ¿Las fechas se normalizan en backend o llegan como en el SQL (texto libre)?
8. ¿Qué enviar en `summaryOrigin` (reglas, modelo de lenguaje…)? ¿El resumen incluirá texto generado por IA?
