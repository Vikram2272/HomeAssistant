import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import { buildBaseUrl, fetchStates } from '../api/homeAssistant'
import { createHaWebSocket } from '../api/websocket'

const DEFAULT_ROOMS = [
  { id: 'front-door', name: 'Front Door', icon: 'door-open', devices: [] },
  { id: 'master-bed', name: 'Master Bedroom', icon: 'bed-double', devices: [] },
  { id: 'meals', name: 'Meals', icon: 'utensils', devices: [] },
  { id: 'kitchen', name: 'Kitchen', icon: 'chef-hat', devices: [] },
  { id: 'living', name: 'Living Room', icon: 'sofa', devices: [] },
  { id: 'office', name: 'Office', icon: 'monitor', devices: [] },
  { id: 'garage', name: 'Garage', icon: 'car', devices: [] },
]

function loadRooms() {
  try {
    const saved = localStorage.getItem('ha_rooms')
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_ROOMS
}

function loadConnection() {
  try {
    const saved = localStorage.getItem('ha_connection')
    if (saved) return JSON.parse(saved)
  } catch {}
  return { ip: '', port: '8123', token: '', isConnected: false }
}

const VALID_THEMES = ['midnight', 'ocean', 'forest', 'sunset', 'light']

function loadTheme() {
  const saved = localStorage.getItem('ha_theme')
  // migrate old 'dark' value
  if (saved === 'dark') return 'midnight'
  return VALID_THEMES.includes(saved) ? saved : 'midnight'
}

const initialState = {
  connection: loadConnection(),
  entities: {},
  rooms: loadRooms(),
  theme: loadTheme(),
  selectedRoom: null,
  wsStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'error'
  wsError: null,
  loading: false,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, loading: true, error: null }

    case 'SET_CONNECTED':
      return {
        ...state,
        loading: false,
        error: null,
        // Store ip/port/token in state so getBaseUrl()/getToken() work immediately
        connection: { ip: action.ip, port: action.port, token: action.token, isConnected: true },
        entities: action.entities,
      }

    case 'SET_ERROR':
      return {
        ...state,
        loading: false,
        error: action.error,
        connection: { ...state.connection, isConnected: false },
      }

    case 'DISCONNECT':
      return {
        ...state,
        connection: { ...state.connection, isConnected: false },
        entities: {},
        wsStatus: 'disconnected',
        wsError: null,
      }

    case 'UPDATE_CONNECTION_FIELD':
      return {
        ...state,
        connection: { ...state.connection, [action.field]: action.value },
      }

    case 'UPDATE_ENTITY':
      if (!action.entityId || !action.state) return state
      return {
        ...state,
        entities: { ...state.entities, [action.entityId]: action.state },
      }

    case 'SET_WS_STATUS':
      return { ...state, wsStatus: action.status, wsError: action.error || null }

    case 'SET_ROOMS':
      return { ...state, rooms: action.rooms }

    case 'ADD_DEVICE_TO_ROOM': {
      const rooms = state.rooms.map(room =>
        room.id === action.roomId && !room.devices.includes(action.entityId)
          ? { ...room, devices: [...room.devices, action.entityId] }
          : room
      )
      return { ...state, rooms }
    }

    case 'REMOVE_DEVICE_FROM_ROOM': {
      const rooms = state.rooms.map(room =>
        room.id === action.roomId
          ? { ...room, devices: room.devices.filter(d => d !== action.entityId) }
          : room
      )
      return { ...state, rooms }
    }

    case 'ADD_ROOM': {
      const newRoom = {
        id: `room-${Date.now()}`,
        name: action.name,
        icon: action.icon || 'home',
        devices: [],
      }
      return { ...state, rooms: [...state.rooms, newRoom] }
    }

    case 'REMOVE_ROOM': {
      const rooms = state.rooms.filter(r => r.id !== action.roomId)
      const selectedRoom = state.selectedRoom === action.roomId ? (rooms[0]?.id || null) : state.selectedRoom
      return { ...state, rooms, selectedRoom }
    }

    case 'RENAME_ROOM': {
      const rooms = state.rooms.map(r =>
        r.id === action.roomId ? { ...r, name: action.name } : r
      )
      return { ...state, rooms }
    }

    case 'SELECT_ROOM':
      return { ...state, selectedRoom: action.roomId }

    case 'SET_THEME':
      return { ...state, theme: action.theme }

    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const wsRef = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // Persist rooms
  useEffect(() => {
    localStorage.setItem('ha_rooms', JSON.stringify(state.rooms))
  }, [state.rooms])

  // Persist theme
  useEffect(() => {
    localStorage.setItem('ha_theme', state.theme)
    document.documentElement.setAttribute('data-theme', state.theme)
  }, [state.theme])

  // Init theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
    // Select first room if none selected
    if (!state.selectedRoom && state.rooms.length > 0) {
      dispatch({ type: 'SELECT_ROOM', roomId: state.rooms[0].id })
    }
  }, [])

  const connect = useCallback(async (ip, port, token) => {
    dispatch({ type: 'SET_CONNECTING' })

    const baseUrl = buildBaseUrl(ip, port)

    // Persist connection info
    localStorage.setItem('ha_connection', JSON.stringify({ ip, port, token, isConnected: false }))

    try {
      const states = await fetchStates(baseUrl, token)
      const entities = {}
      states.forEach(s => { entities[s.entity_id] = s })

      dispatch({ type: 'SET_CONNECTED', entities, ip, port, token })

      // Update connection in storage as connected
      localStorage.setItem('ha_connection', JSON.stringify({ ip, port, token, isConnected: true }))

      // Setup WebSocket for real-time updates
      if (wsRef.current) wsRef.current.destroy()

      dispatch({ type: 'SET_WS_STATUS', status: 'connecting' })

      wsRef.current = createHaWebSocket({
        baseUrl,
        token,
        onConnect: () => dispatch({ type: 'SET_WS_STATUS', status: 'connected' }),
        onDisconnect: () => dispatch({ type: 'SET_WS_STATUS', status: 'disconnected' }),
        onError: (err) => dispatch({ type: 'SET_WS_STATUS', status: 'error', error: err.message }),
        onStateChange: (entityId, newState) => {
          dispatch({ type: 'UPDATE_ENTITY', entityId, state: newState })
        },
      })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err.message })
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.destroy()
      wsRef.current = null
    }
    localStorage.removeItem('ha_connection')
    dispatch({ type: 'DISCONNECT' })
  }, [])

  // Auto-reconnect if we had a saved connection
  useEffect(() => {
    const saved = loadConnection()
    if (saved.isConnected && saved.ip && saved.token) {
      connect(saved.ip, saved.port, saved.token)
    }
  }, [])

  const getBaseUrl = useCallback(() => {
    const { ip, port } = stateRef.current.connection
    return buildBaseUrl(ip, port)
  }, [])

  const getToken = useCallback(() => stateRef.current.connection.token, [])

  const value = {
    ...state,
    dispatch,
    connect,
    disconnect,
    getBaseUrl,
    getToken,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
