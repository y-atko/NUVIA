// DATOS DE EJEMPLO, 100 % FICTICIOS: ningún nombre, expediente ni dato clínico pertenece a una
// persona real. Tienen la forma del contrato (docs/API_CONTRACT.md), es decir, lo mismo que
// devolvería el backend. Los nombres de tabla y de campo se tomaron del diccionario de datos
// solo como ilustración: el contrato los trata como texto libre y NO se asume que existan
// tal cual en el SQL definitivo.
//
// Casos que cubre (para probar la interfaz con situaciones reales de un expediente):
//   EXP-1042  expediente completo, todo con fuente (y una fecha con formato distinto)
//   EXP-1187  expediente incompleto: secciones sin datos y datos no documentados
//   EXP-1203  registros contradictorios y un cambio de valores que solo requiere revisión
//   EXP-1311  afirmaciones sin fuente verificable (sin fuente / referencia inexistente)
//   EXP-1355  expediente sin información
//   EXP-1402, EXP-1466, EXP-1519  expedientes completos y más breves

const META = { contractVersion: '0.3-provisional', isTestData: true, generatedAt: '2026-11-02T08:00:00Z' }

const S = (id, table, recordId, date, field, excerpt) => ({ id, kind: 'record', table, recordId, date, field, excerpt })
const I = (id, text, sourceIds, date = null, status = 'documented') => ({ id, text, status, date, sourceIds })
const sec = (key, title, items = []) => ({ key, title, items })
const A = (id, type, title, description, claimIds = [], sourceIds = []) => ({ id, type, title, description, claimIds, sourceIds })
const R = (table, recordId, date, fields) => ({ table, recordId, date, fields })

function build({ id, label, age, sex, details, sections, alerts = [], sources = [], records = [], notes = null }) {
  return {
    meta: { ...META, summaryOrigin: null, notes },
    patient: { id, label, age, sex, identifiers: [{ label: 'Expediente', value: id }], details },
    summary: { sections },
    alerts,
    sources,
    records
  }
}

// ---------- EXP-1042: expediente completo ----------
const RECORD_1042 = build({
  id: 'EXP-1042', label: 'Ana Lucía Treviño Garza', age: 58, sex: 'F',
  details: [{ label: 'Servicio', value: 'Medicina interna' }, { label: 'Último ingreso', value: '02/09/2026' }],
  sections: [
    sec('motivo', 'Motivo de atención reciente', [
      I('a-c1', 'Acudió a urgencias por dolor abdominal de dos días de evolución, sin vómito.', ['a-s1'], '2026-09-02'),
      I('a-c2', 'Egresó el 05/09/2026 con indicación de seguimiento ambulatorio.', ['a-s2'], '2026-09-05')
    ]),
    sec('antecedentes', 'Antecedentes', [
      I('a-c3', 'Hipertensión arterial referida desde hace varios años.', ['a-s3'], '2025-11-18'),
      I('a-c4', 'Diabetes mellitus tipo 2 registrada en la historia clínica.', ['a-s3'], '2025-11-18'),
      I('a-c5', 'Alergia a penicilina referida en la historia clínica.', ['a-s3'], '2025-11-18')
    ]),
    sec('historial', 'Historial clínico', [
      I('a-c6', 'Gastritis aguda (diagnóstico de la nota de urgencias).', ['a-s4'], '2026-09-02')
    ]),
    sec('consultas', 'Consultas anteriores', [
      I('a-c7', 'Consulta de control de presión arterial, sin cambios en el tratamiento.', ['a-s9'], '2026-03-14'),
      I('a-c8', 'Atención en urgencias del 02/09/2026 con ingreso a hospitalización.', ['a-s1', 'a-s8'], '2026-09-02')
    ]),
    sec('estudios', 'Estudios y resultados', [
      I('a-c9', 'Estudios realizados en el ingreso: biometría hemática y endoscopia superior.', ['a-s8'], '2026-09-02')
    ]),
    sec('medicamentos', 'Medicamentos e indicaciones', [
      I('a-c10', 'Omeprazol 20 mg por vía oral cada 24 horas; indicación activa.', ['a-s5'], '2026-09-02'),
      I('a-c11', 'Losartán 50 mg por vía oral cada 24 horas durante 30 días (receta).', ['a-s6'], '2026-09-05'),
      I('a-c12', 'Metformina 850 mg por vía oral cada 12 horas (medicamento actual).', ['a-s3'], '2025-11-18')
    ]),
    sec('signos', 'Signos vitales', [
      I('a-c13', 'Última medición: presión 128/82 mmHg, pulso 76 por minuto, saturación 97 %.', ['a-s7'], '05/09/26', 'needs_review')
    ])
  ],
  alerts: [
    A('a-al1', 'review', 'Fecha con formato distinto en un registro', 'La fecha del registro de signos vitales llegó como «05/09/26». Se muestra tal como llegó, sin convertirla.', ['a-c13'], ['a-s7'])
  ],
  sources: [
    S('a-s1', 'NotaMedicaUrg', 'URG-20260902-0101', '2026-09-02', 'MotivoConsulta', 'Dolor abdominal de dos días de evolución, sin vómito.'),
    S('a-s2', 'notaegreso', 'EGR-20260905-0044', '2026-09-05', 'MotivoEgreso', 'Mejoría. Egreso con seguimiento ambulatorio.'),
    S('a-s3', 'historiaclinica', 'HC-0007', '2025-11-18', 'Interrogatorio', 'Refiere hipertensión arterial desde hace varios años y diabetes tipo 2. Alergia a penicilina. Toma metformina 850 mg cada 12 horas.'),
    S('a-s4', 'NotaMedicaUrg', 'URG-20260902-0101', '2026-09-02', 'DesDiag1', 'Gastritis aguda'),
    S('a-s5', 'Indicaciones', 'IND-0310', '2026-09-02', 'Indicacion', 'Omeprazol; 20 mg; vía oral; cada 24 horas; estatus: activa.'),
    S('a-s6', 'RecetasDet', 'RDT-0520', '2026-09-05', 'Articulo', 'Losartán 50 mg; vía oral; cada 24 horas; durante 30 días.'),
    S('a-s7', 'SignosVitales', 'SV-2201', '05/09/26', 'PA_NoInvasiva1', 'PA 128/82 mmHg; pulso 76 por minuto; SatO2 97 %.'),
    S('a-s8', 'NotaIngreso_HC', 'ING-0033', '2026-09-02', 'EstudiosRealizados', 'Biometría hemática. Endoscopia superior.'),
    S('a-s9', 'NotasEvolucion', 'EVO-0412', '2026-03-14', 'Plan1', 'Control de presión arterial dentro de metas. Continúa el mismo tratamiento.')
  ],
  records: [
    R('historiaclinica', 'HC-0007', '2025-11-18', { Interrogatorio: 'Refiere hipertensión arterial desde hace varios años y diabetes tipo 2. Alergia a penicilina. Toma metformina 850 mg cada 12 horas.', MotivoConsulta: 'Valoración general', Fumador: 'NO', MedicamentosActuales: '' }),
    R('NotaMedicaUrg', 'URG-20260902-0101', '2026-09-02', { Triage: 'Amarillo', MotivoConsulta: 'Dolor abdominal de dos días de evolución, sin vómito.', DesDiag1: 'Gastritis aguda', Destino: 'Hospitalización' }),
    R('Indicaciones', 'IND-0310', '2026-09-02', { Indicacion: 'Omeprazol', Dosis: '20', UdsDosis: 'mg', Via: 'Oral', Frecuencia: '24', UdsFrecuencia: 'horas', Status: 'Activa' }),
    R('SignosVitales', 'SV-2201', '05/09/26', { PA_NoInvasiva1: '128/82', Pulso: '76', SatO2: '97', Temperatura: '36.6' }),
    R('NotaIngreso_HC', 'ING-0033', '2026-09-02', { MotivoIngreso: 'Dolor abdominal', EstudiosRealizados: 'Biometría hemática. Endoscopia superior.' })
  ]
})

// ---------- EXP-1187: expediente incompleto ----------
const RECORD_1187 = build({
  id: 'EXP-1187', label: 'Jorge Armando Salinas Leal', age: 41, sex: 'M',
  details: [{ label: 'Servicio', value: 'Urgencias' }, { label: 'Último ingreso', value: '20/08/2026' }],
  sections: [
    sec('motivo', 'Motivo de atención reciente', [I('b-c1', 'Acudió a urgencias por cefalea de cuatro días.', ['b-s1'], '2026-08-20')]),
    sec('antecedentes', 'Antecedentes', [I('b-c2', 'Cirugía de apéndice en la infancia, referida por el paciente.', ['b-s2'], null)]),
    sec('historial', 'Historial clínico'),
    sec('consultas', 'Consultas anteriores'),
    sec('estudios', 'Estudios y resultados'),
    sec('medicamentos', 'Medicamentos e indicaciones'),
    sec('signos', 'Signos vitales')
  ],
  alerts: [
    A('b-al1', 'missing', 'Alergias: sin información en los registros', 'Ningún registro disponible menciona alergias. Que el dato no aparezca en el expediente no confirma que el paciente no las tenga.'),
    A('b-al2', 'missing', 'Medicamentos e indicaciones: sin registros', 'No se encontraron indicaciones ni recetas asociadas a este expediente.'),
    A('b-al3', 'missing', 'Diagnósticos: sin registros', 'La nota de urgencias disponible no incluye un diagnóstico.', [], ['b-s1']),
    A('b-al4', 'missing', 'Signos vitales y estudios: sin registros'),
    A('b-al5', 'review', 'Registro sin fecha', 'La historia clínica llegó sin fecha, por lo que no se puede ubicar en el tiempo.', ['b-c2'], ['b-s2'])
  ],
  sources: [
    S('b-s1', 'NotaMedicaUrg', 'URG-20260820-0202', '2026-08-20', 'MotivoConsulta', 'Cefalea de cuatro días.'),
    S('b-s2', 'historiaclinica', 'HC-0012', null, 'Interrogatorio', 'Antecedentes personales: refiere cirugía de apéndice en la infancia.')
  ],
  records: [R('NotaMedicaUrg', 'URG-20260820-0202', '2026-08-20', { Triage: 'Verde', MotivoConsulta: 'Cefalea de cuatro días.', DesDiag1: '' })]
})

// ---------- EXP-1203: contradicciones ----------
const RECORD_1203 = build({
  id: 'EXP-1203', label: 'Roberto Elizondo Cantú', age: 67, sex: 'M',
  details: [{ label: 'Servicio', value: 'Medicina interna' }, { label: 'Último ingreso', value: '10/09/2026' }],
  sections: [
    sec('motivo', 'Motivo de atención reciente', [I('c-c1', 'Acudió a urgencias por control de glucosa elevada.', ['c-s6'], '2026-09-10')]),
    sec('antecedentes', 'Antecedentes', [I('c-c7', 'Diabetes mellitus tipo 2 registrada en la historia clínica.', ['c-s1'], '2025-06-02')]),
    sec('historial', 'Historial clínico'),
    sec('consultas', 'Consultas anteriores', [I('c-c8', 'Consulta de seguimiento por diabetes (junio de 2025).', ['c-s1'], '2025-06-02')]),
    sec('estudios', 'Estudios y resultados'),
    sec('medicamentos', 'Medicamentos e indicaciones', [
      I('c-c2', 'Metformina 850 mg cada 12 horas (historia clínica, 02/06/2025).', ['c-s1'], '2025-06-02', 'needs_review'),
      I('c-c3', 'Metformina 850 mg cada 24 horas (indicación activa, 10/09/2026).', ['c-s2'], '2026-09-10', 'needs_review'),
      I('c-c4', 'Enoxaparina 40 mg cada 24 horas con estatus activo y una fecha de suspensión anterior.', ['c-s3'], '2026-09-10', 'needs_review')
    ]),
    sec('signos', 'Signos vitales', [
      I('c-c5', 'Peso registrado: 82 kg.', ['c-s4'], '2026-08-10'),
      I('c-c6', 'Peso registrado: 74 kg.', ['c-s5'], '2026-09-01')
    ])
  ],
  alerts: [
    A('c-al1', 'contradiction', 'Frecuencia distinta para el mismo medicamento', 'La historia clínica indica metformina cada 12 horas y la indicación activa cada 24 horas. Los registros son de fechas distintas: confirma cuál está vigente.', ['c-c2', 'c-c3'], ['c-s1', 'c-s2']),
    A('c-al2', 'contradiction', 'Indicación activa con fecha de suspensión', 'La enoxaparina figura como activa, pero el mismo registro trae una fecha de suspensión (08/09/2026) anterior a la fecha de la indicación.', ['c-c4'], ['c-s3']),
    A('c-al3', 'review', 'Cambio de peso entre dos registros', 'Los valores difieren (82 kg y 74 kg) y corresponden a fechas distintas. Puede ser un cambio real y no un error de captura.', ['c-c5', 'c-c6'], ['c-s4', 'c-s5']),
    A('c-al4', 'missing', 'Alergias: sin información en los registros', 'Ningún registro disponible menciona alergias. Que el dato no aparezca en el expediente no confirma que el paciente no las tenga.')
  ],
  sources: [
    S('c-s1', 'historiaclinica', 'HC-0021', '2025-06-02', 'MedicamentosActuales', 'Diabetes tipo 2. Metformina 850 mg cada 12 horas.'),
    S('c-s2', 'Indicaciones', 'IND-0415', '2026-09-10', 'Indicacion', 'Metformina; 850 mg; vía oral; cada 24 horas; estatus: activa.'),
    S('c-s3', 'Indicaciones', 'IND-0416', '2026-09-10', 'Status', 'Enoxaparina; 40 mg; subcutánea; cada 24 horas; estatus: activa; fecha de suspensión: 2026-09-08.'),
    S('c-s4', 'SignosVitales', 'SV-3301', '2026-08-10', 'Peso', '82 kg'),
    S('c-s5', 'SignosVitales', 'SV-3302', '2026-09-01', 'Peso', '74 kg'),
    S('c-s6', 'NotaMedicaUrg', 'URG-20260910-0303', '2026-09-10', 'MotivoConsulta', 'Control de glucosa elevada.')
  ],
  records: [
    R('Indicaciones', 'IND-0415', '2026-09-10', { Indicacion: 'Metformina', Dosis: '850', UdsDosis: 'mg', Via: 'Oral', Frecuencia: '24', UdsFrecuencia: 'horas', Status: 'Activa' }),
    R('Indicaciones', 'IND-0416', '2026-09-10', { Indicacion: 'Enoxaparina', Dosis: '40', UdsDosis: 'mg', Via: 'Subcutánea', Frecuencia: '24', UdsFrecuencia: 'horas', Status: 'Activa', FechaSuspension: '2026-09-08' }),
    R('historiaclinica', 'HC-0021', '2025-06-02', { MedicamentosActuales: 'Diabetes tipo 2. Metformina 850 mg cada 12 horas.' })
  ]
})

// ---------- EXP-1311: afirmaciones sin fuente verificable ----------
const RECORD_1311 = build({
  id: 'EXP-1311', label: 'Daniela Guadalupe Peña Rangel', age: 33, sex: 'F',
  details: [{ label: 'Servicio', value: 'Urgencias' }, { label: 'Último ingreso', value: '14/09/2026' }],
  sections: [
    sec('motivo', 'Motivo de atención reciente', [I('d-c1', 'Acudió a urgencias por tos y fiebre de tres días.', ['d-s1'], '2026-09-14')]),
    // Declarada como "documented" pero sin fuente: la interfaz NO la muestra como respaldada.
    sec('antecedentes', 'Antecedentes', [I('d-c2', 'Antecedente de asma.', [])]),
    // Referencia a una fuente que no existe en la lista `sources`.
    sec('medicamentos', 'Medicamentos e indicaciones', [I('d-c3', 'Uso de salbutamol a demanda.', ['d-s99'])]),
    sec('consultas', 'Consultas anteriores', [I('d-c4', 'Evolución favorable en las primeras 48 horas.', [], null, 'needs_review')])
  ],
  alerts: [
    A('d-al1', 'review', 'Afirmaciones sin registro de origen verificable', 'Algunas afirmaciones llegaron sin fuente o con una referencia que no existe. No se presentan como confirmadas.', ['d-c2', 'd-c3', 'd-c4'])
  ],
  sources: [S('d-s1', 'NotaMedicaUrg', 'URG-20260914-0404', '2026-09-14', 'MotivoConsulta', 'Tos y fiebre de tres días.')],
  records: []
})

// ---------- EXP-1355: sin información ----------
const RECORD_1355 = build({
  id: 'EXP-1355', label: 'Luis Fernando Garza Morales', age: 29, sex: 'M', details: [], sections: [],
  notes: 'El expediente no contiene registros clínicos.'
})

// ---------- Expedientes completos y breves ----------
const RECORD_1402 = build({
  id: 'EXP-1402', label: 'Marta Elena Villarreal Soto', age: 72, sex: 'F',
  details: [{ label: 'Servicio', value: 'Consulta externa' }, { label: 'Última consulta', value: '22/10/2026' }],
  sections: [
    sec('motivo', 'Motivo de atención reciente', [I('e-c1', 'Acudió a consulta por dolor de rodilla derecha al caminar, de varios meses.', ['e-s1'], '2026-10-22')]),
    sec('antecedentes', 'Antecedentes', [
      I('e-c2', 'Hipotiroidismo registrado en la historia clínica.', ['e-s2'], '2024-05-10'),
      I('e-c3', 'Sin alergias medicamentosas referidas.', ['e-s2'], '2024-05-10')
    ]),
    sec('historial', 'Historial clínico', [I('e-c4', 'Osteoartrosis de rodilla (diagnóstico de la consulta del 22/10/2026).', ['e-s3'], '2026-10-22')]),
    sec('consultas', 'Consultas anteriores', [I('e-c5', 'Control de hipotiroidismo el 15/04/2026, sin cambios en la dosis.', ['e-s4'], '2026-04-15')]),
    sec('estudios', 'Estudios y resultados', [I('e-c6', 'TSH de control del 15/04/2026 dentro del rango del laboratorio.', ['e-s4'], '2026-04-15')]),
    sec('medicamentos', 'Medicamentos e indicaciones', [I('e-c7', 'Levotiroxina 75 mcg por vía oral cada 24 horas.', ['e-s5'], '2026-04-15')]),
    sec('signos', 'Signos vitales', [I('e-c8', 'Última medición: presión 124/78 mmHg, peso 68 kg.', ['e-s6'], '2026-10-22')])
  ],
  sources: [
    S('e-s1', 'NotasEvolucion', 'EVO-0733', '2026-10-22', 'Subjetivo', 'Refiere dolor en la rodilla derecha al caminar desde hace varios meses.'),
    S('e-s2', 'historiaclinica', 'HC-0188', '2024-05-10', 'Interrogatorio', 'Hipotiroidismo. Niega alergias a medicamentos.'),
    S('e-s3', 'NotasEvolucion', 'EVO-0733', '2026-10-22', 'Analisis', 'Osteoartrosis de rodilla derecha.'),
    S('e-s4', 'NotasEvolucion', 'EVO-0611', '2026-04-15', 'Plan1', 'Control de hipotiroidismo. TSH dentro del rango. Sin cambios en la dosis.'),
    S('e-s5', 'Indicaciones', 'IND-0902', '2026-04-15', 'Indicacion', 'Levotiroxina; 75 mcg; vía oral; cada 24 horas; estatus: activa.'),
    S('e-s6', 'SignosVitales', 'SV-4120', '2026-10-22', 'PA_NoInvasiva1', 'PA 124/78 mmHg; peso 68 kg.')
  ],
  records: [R('NotasEvolucion', 'EVO-0733', '2026-10-22', { Subjetivo: 'Refiere dolor en la rodilla derecha al caminar desde hace varios meses.', Analisis: 'Osteoartrosis de rodilla derecha.' })]
})

const RECORD_1466 = build({
  id: 'EXP-1466', label: 'Carlos Eduardo Lozano Ibarra', age: 49, sex: 'M',
  details: [{ label: 'Servicio', value: 'Consulta externa' }, { label: 'Última consulta', value: '28/10/2026' }],
  sections: [
    sec('motivo', 'Motivo de atención reciente', [I('f-c1', 'Acudió por dolor lumbar de una semana, posterior a un esfuerzo físico.', ['f-s1'], '2026-10-28')]),
    sec('antecedentes', 'Antecedentes', [I('f-c2', 'Episodio previo de dolor lumbar en 2023.', ['f-s2'], '2023-07-04')]),
    sec('historial', 'Historial clínico', [I('f-c3', 'Lumbalgia mecánica (diagnóstico de la consulta del 28/10/2026).', ['f-s3'], '2026-10-28')]),
    sec('consultas', 'Consultas anteriores', [I('f-c4', 'Consulta por dolor lumbar el 04/07/2023.', ['f-s2'], '2023-07-04')]),
    sec('estudios', 'Estudios y resultados'),
    sec('medicamentos', 'Medicamentos e indicaciones', [I('f-c5', 'Ibuprofeno 400 mg por vía oral cada 8 horas por 5 días (indicación del 28/10/2026).', ['f-s4'], '2026-10-28')]),
    sec('signos', 'Signos vitales', [I('f-c6', 'Última medición: presión 118/74 mmHg, pulso 70 por minuto.', ['f-s5'], '2026-10-28')])
  ],
  alerts: [A('f-al1', 'missing', 'Alergias: sin información en los registros', 'Ningún registro disponible menciona alergias. Que el dato no aparezca en el expediente no confirma que el paciente no las tenga.')],
  sources: [
    S('f-s1', 'NotasEvolucion', 'EVO-0801', '2026-10-28', 'Subjetivo', 'Dolor lumbar de una semana tras cargar objetos pesados.'),
    S('f-s2', 'NotasEvolucion', 'EVO-0099', '2023-07-04', 'Subjetivo', 'Dolor lumbar de tres días. Sin irradiación.'),
    S('f-s3', 'NotasEvolucion', 'EVO-0801', '2026-10-28', 'Analisis', 'Lumbalgia mecánica.'),
    S('f-s4', 'Indicaciones', 'IND-1011', '2026-10-28', 'Indicacion', 'Ibuprofeno; 400 mg; vía oral; cada 8 horas; durante 5 días.'),
    S('f-s5', 'SignosVitales', 'SV-4388', '2026-10-28', 'PA_NoInvasiva1', 'PA 118/74 mmHg; pulso 70 por minuto.')
  ],
  records: []
})

const RECORD_1519 = build({
  id: 'EXP-1519', label: 'Sofía Alejandra Medina Cavazos', age: 36, sex: 'F',
  details: [{ label: 'Servicio', value: 'Consulta externa' }, { label: 'Última consulta', value: '30/10/2026' }],
  sections: [
    sec('motivo', 'Motivo de atención reciente', [I('g-c1', 'Acudió por cefalea recurrente, de predominio matutino, de dos meses.', ['g-s1'], '2026-10-30')]),
    sec('antecedentes', 'Antecedentes', [
      I('g-c2', 'Alergia a sulfonamidas referida en la historia clínica.', ['g-s2'], '2025-02-20'),
      I('g-c3', 'Antecedente familiar de migraña (madre).', ['g-s2'], '2025-02-20')
    ]),
    sec('historial', 'Historial clínico', [I('g-c4', 'Cefalea tensional (diagnóstico de la consulta del 30/10/2026).', ['g-s3'], '2026-10-30')]),
    sec('consultas', 'Consultas anteriores', [I('g-c5', 'Valoración general el 20/02/2025 sin hallazgos relevantes.', ['g-s2'], '2025-02-20')]),
    sec('estudios', 'Estudios y resultados'),
    sec('medicamentos', 'Medicamentos e indicaciones', [I('g-c6', 'Paracetamol 500 mg por vía oral cada 8 horas si hay dolor (indicación del 30/10/2026).', ['g-s4'], '2026-10-30')]),
    sec('signos', 'Signos vitales', [I('g-c7', 'Última medición: presión 110/70 mmHg, pulso 72 por minuto.', ['g-s5'], '2026-10-30')])
  ],
  sources: [
    S('g-s1', 'NotasEvolucion', 'EVO-0850', '2026-10-30', 'Subjetivo', 'Cefalea recurrente matutina desde hace dos meses.'),
    S('g-s2', 'historiaclinica', 'HC-0240', '2025-02-20', 'Interrogatorio', 'Alergia a sulfonamidas. Madre con migraña. Valoración general sin hallazgos.'),
    S('g-s3', 'NotasEvolucion', 'EVO-0850', '2026-10-30', 'Analisis', 'Cefalea tensional.'),
    S('g-s4', 'Indicaciones', 'IND-1090', '2026-10-30', 'Indicacion', 'Paracetamol; 500 mg; vía oral; cada 8 horas; si hay dolor.'),
    S('g-s5', 'SignosVitales', 'SV-4401', '2026-10-30', 'PA_NoInvasiva1', 'PA 110/70 mmHg; pulso 72 por minuto.')
  ],
  records: []
})

export const MOCK_RECORDS = {
  'EXP-1042': RECORD_1042, 'EXP-1187': RECORD_1187, 'EXP-1203': RECORD_1203, 'EXP-1311': RECORD_1311,
  'EXP-1355': RECORD_1355, 'EXP-1402': RECORD_1402, 'EXP-1466': RECORD_1466, 'EXP-1519': RECORD_1519
}

const lastDate = { 'EXP-1042': '2026-09-05', 'EXP-1187': '2026-08-20', 'EXP-1203': '2026-09-10', 'EXP-1311': '2026-09-14', 'EXP-1355': null, 'EXP-1402': '2026-10-22', 'EXP-1466': '2026-10-28', 'EXP-1519': '2026-10-30' }

export const MOCK_PATIENTS = Object.values(MOCK_RECORDS).map((r) => ({
  id: r.patient.id, label: r.patient.label, age: r.patient.age, sex: r.patient.sex, lastRecordDate: lastDate[r.patient.id]
}))
