import { isoOffset } from '../utils/dateHelpers.js'

export const SERVICES = ['Valoración', 'Limpieza dental', 'Blanqueamiento', 'Ortodoncia']

export const CLINIC = {
  name: 'Clínica Dental Sonrisa',
  dentistName: 'Dra. Camila Reyes',
  address: 'Av. Constitución 480, Guadalupe, N.L.',
  hours: 'Lunes a viernes · 9:00 AM – 6:00 PM'
}

export const INITIAL_PATIENTS = [
  { id: 'p1', name: 'Juan Pérez', phone: '81 1234 5601' },
  { id: 'p2', name: 'María López', phone: '81 1234 5602' },
  { id: 'p3', name: 'Pedro García', phone: '81 1234 5603' },
  { id: 'p4', name: 'Ana Torres', phone: '81 1234 5604' },
  { id: 'p5', name: 'Laura Mendoza', phone: '81 1234 5605' },
  { id: 'p6', name: 'Roberto Silva', phone: '81 1234 5606' },
  { id: 'p7', name: 'Carla Jiménez', phone: '81 1234 5607' },
  { id: 'p8', name: 'Diego Herrera', phone: '81 1234 5608' },
  { id: 'p9', name: 'Sofía Ramírez', phone: '81 1234 5609' },
  { id: 'p10', name: 'Miguel Ortiz', phone: '81 1234 5610' }
]

// Every appointment is generated relative to "today" so the prototype always
// feels current, no matter what day it's actually opened.
function apt(id, patientId, offset, time, service, status) {
  return { id, patientId, date: isoOffset(offset), time, service, status }
}

export const INITIAL_APPOINTMENTS = [
  // --- Hoy (7 citas: 2 pendientes de confirmar, el resto confirmadas) ---
  apt('a1', 'p1', 0, '09:00 AM', 'Limpieza dental', 'confirmada'),
  apt('a2', 'p2', 0, '10:00 AM', 'Valoración', 'confirmada'),
  apt('a3', 'p3', 0, '11:30 AM', 'Ortodoncia', 'pendiente'),
  apt('a4', 'p4', 0, '01:00 PM', 'Limpieza dental', 'confirmada'),
  apt('a5', 'p5', 0, '12:00 PM', 'Blanqueamiento', 'confirmada'),
  apt('a6', 'p6', 0, '02:00 PM', 'Valoración', 'pendiente'),
  apt('a7', 'p7', 0, '04:00 PM', 'Limpieza dental', 'confirmada'),

  // --- Próximas (15 citas confirmadas) ---
  apt('f1', 'p1', 9, '04:00 PM', 'Limpieza dental', 'confirmada'),
  apt('f2', 'p2', 14, '09:00 AM', 'Ortodoncia', 'confirmada'),
  apt('f3', 'p3', 19, '11:00 AM', 'Ortodoncia', 'confirmada'),
  apt('f4', 'p4', 6, '10:00 AM', 'Valoración', 'confirmada'),
  apt('f5', 'p5', 11, '03:00 PM', 'Blanqueamiento', 'confirmada'),
  apt('f6', 'p6', 8, '05:00 PM', 'Limpieza dental', 'confirmada'),
  apt('f7', 'p7', 13, '12:00 PM', 'Valoración', 'confirmada'),
  apt('f8', 'p8', 4, '09:00 AM', 'Limpieza dental', 'confirmada'),
  apt('f9', 'p8', 17, '02:00 PM', 'Ortodoncia', 'confirmada'),
  apt('f10', 'p9', 21, '10:00 AM', 'Blanqueamiento', 'confirmada'),
  apt('f11', 'p9', 3, '04:00 PM', 'Valoración', 'confirmada'),
  apt('f12', 'p10', 23, '11:00 AM', 'Limpieza dental', 'confirmada'),
  apt('f13', 'p10', 7, '01:00 PM', 'Ortodoncia', 'confirmada'),
  apt('f14', 'p1', 25, '03:00 PM', 'Blanqueamiento', 'confirmada'),
  apt('f15', 'p4', 16, '05:00 PM', 'Limpieza dental', 'confirmada'),

  // --- Canceladas a futuro (no deben contar como "próxima cita") ---
  apt('c1', 'p2', 5, '10:00 AM', 'Blanqueamiento', 'cancelada'),
  apt('c2', 'p6', 18, '09:00 AM', 'Valoración', 'cancelada'),

  // --- Historial pasado (completadas, define "última cita") ---
  apt('h1', 'p1', -1, '11:00 AM', 'Limpieza dental', 'completada'),
  apt('h2', 'p1', -15, '10:00 AM', 'Valoración', 'completada'),
  apt('h3', 'p2', -6, '09:00 AM', 'Valoración', 'completada'),
  apt('h4', 'p2', -20, '03:00 PM', 'Limpieza dental', 'completada'),
  apt('h5', 'p3', -10, '12:00 PM', 'Valoración', 'completada'),
  apt('h6', 'p3', -25, '10:00 AM', 'Ortodoncia', 'completada'),
  apt('h7', 'p4', -3, '02:00 PM', 'Blanqueamiento', 'completada'),
  apt('h8', 'p5', -5, '09:00 AM', 'Valoración', 'completada'),
  apt('h9', 'p5', -30, '04:00 PM', 'Limpieza dental', 'cancelada'),
  apt('h10', 'p6', -2, '10:00 AM', 'Limpieza dental', 'completada'),
  apt('h11', 'p7', -4, '01:00 PM', 'Ortodoncia', 'completada'),
  apt('h12', 'p8', -8, '11:00 AM', 'Valoración', 'completada'),
  apt('h13', 'p9', -12, '09:00 AM', 'Limpieza dental', 'completada'),
  apt('h14', 'p10', -7, '03:00 PM', 'Blanqueamiento', 'completada')
]

// The chat prototype simulates a single WhatsApp conversation, "logged in"
// as this patient — matching the worked examples in the product brief.
export const DEMO_PATIENT_ID = 'p1'
