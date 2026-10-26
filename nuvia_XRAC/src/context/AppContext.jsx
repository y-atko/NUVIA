import React, { createContext, useContext, useMemo, useReducer } from 'react'
import { INITIAL_APPOINTMENTS, INITIAL_PATIENTS, DEMO_PATIENT_ID } from '../data/mockData.js'

const AppStateContext = createContext(null)
const AppDispatchContext = createContext(null)

const initialState = {
  patients: INITIAL_PATIENTS,
  appointments: INITIAL_APPOINTMENTS
}

let nextApptSeq = 1000
let nextPatientSeq = 100

function slugId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function findOrCreatePatient(patients, name) {
  const normalized = name.trim().toLowerCase()
  const existing = patients.find((p) => p.name.trim().toLowerCase() === normalized)
  if (existing) return { patients, patient: existing }
  const patient = { id: `p${nextPatientSeq++}`, name: name.trim(), phone: '' }
  return { patients: [...patients, patient], patient }
}

function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_APPOINTMENT': {
      const { patientName, service, date, time } = action.payload
      const { patients, patient } = findOrCreatePatient(state.patients, patientName)
      const appointment = {
        id: slugId('a'),
        patientId: patient.id,
        service,
        date,
        time,
        status: 'confirmada'
      }
      return {
        ...state,
        patients,
        appointments: [...state.appointments, appointment]
      }
    }
    case 'RESCHEDULE_APPOINTMENT': {
      const { appointmentId, date, time } = action.payload
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === appointmentId ? { ...a, date, time, status: 'confirmada' } : a
        )
      }
    }
    case 'CANCEL_APPOINTMENT': {
      const { appointmentId } = action.payload
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === appointmentId ? { ...a, status: 'cancelada' } : a
        )
      }
    }
    case 'CONFIRM_APPOINTMENT': {
      const { appointmentId } = action.payload
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === appointmentId ? { ...a, status: 'confirmada' } : a
        )
      }
    }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const actions = useMemo(
    () => ({
      createAppointment: (payload) => dispatch({ type: 'CREATE_APPOINTMENT', payload }),
      rescheduleAppointment: (payload) => dispatch({ type: 'RESCHEDULE_APPOINTMENT', payload }),
      cancelAppointment: (appointmentId) => dispatch({ type: 'CANCEL_APPOINTMENT', payload: { appointmentId } }),
      confirmAppointment: (appointmentId) => dispatch({ type: 'CONFIRM_APPOINTMENT', payload: { appointmentId } })
    }),
    []
  )

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={actions}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}

export function useAppActions() {
  const ctx = useContext(AppDispatchContext)
  if (!ctx) throw new Error('useAppActions must be used within AppProvider')
  return ctx
}

export { DEMO_PATIENT_ID }
