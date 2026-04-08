import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import WeatherWidget from './WeatherWidget'
import {
  Home, Wifi, WifiOff, Plus, Sun, Moon, LogOut,
  Maximize, Minimize, Palette
} from 'lucide-react'
import './TopBar.css'

const THEMES = [
  { id: 'midnight', label: 'Midnight', color: '#7c6dfa' },
  { id: 'ocean',    label: 'Ocean',    color: '#0ea5e9' },
  { id: 'forest',   label: 'Forest',   color: '#10b981' },
  { id: 'sunset',   label: 'Sunset',   color: '#f97316' },
  { id: 'light',    label: 'Light',    color: '#5b52ee' },
]

export default function TopBar({ onAddRoom }) {
  const { rooms, theme, wsStatus, connection, dispatch, disconnect } = useApp()
  const [showThemes, setShowThemes] = useState(false)
  const [kiosk, setKiosk] = useState(false)
  const themeRef = useRef(null)

  const isConnected = wsStatus === 'connected'
  const isDark = theme !== 'light'

  const scrollTo = (id) =>
    document.getElementById(`room-${id}`)?.scrollIntoView({ behavior: 'smooth' })

  const toggleTheme = () =>
    dispatch({ type: 'SET_THEME', theme: isDark ? 'light' : theme })

  const setTheme = (id) => {
    dispatch({ type: 'SET_THEME', theme: id })
    setShowThemes(false)
  }

  const toggleKiosk = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setKiosk(true)
      } else {
        await document.exitFullscreen()
        setKiosk(false)
      }
    } catch {}
  }

  // Close theme picker on outside click
  useEffect(() => {
    if (!showThemes) return
    const handler = (e) => { if (!themeRef.current?.contains(e.target)) setShowThemes(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showThemes])

  // Sync kiosk state with fullscreen changes
  useEffect(() => {
    const handler = () => setKiosk(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <Home size={17} strokeWidth={1.8} />
          <span>HA Dashboard</span>
        </div>
        <div className={`topbar-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span>{connection.ip || 'disconnected'}</span>
        </div>
      </div>

      {/* Room quick-jump pills */}
      <nav className="topbar-rooms">
        {rooms.map(room => (
          <button key={room.id} className="topbar-pill" onClick={() => scrollTo(room.id)}>
            {room.name}
          </button>
        ))}
      </nav>

      <div className="topbar-right">
        {/* Weather */}
        <WeatherWidget />

        {/* Add Room */}
        <button className="topbar-btn accent" onClick={onAddRoom}>
          <Plus size={14} />
          <span>Room</span>
        </button>

        {/* Theme picker */}
        <div className="theme-picker-wrap" ref={themeRef}>
          <button
            className={`topbar-btn ${showThemes ? 'active' : ''}`}
            onClick={() => setShowThemes(v => !v)}
            title="Change theme"
          >
            <Palette size={15} />
          </button>
          {showThemes && (
            <div className="theme-dropdown">
              <div className="theme-dropdown-title">Theme</div>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`theme-option ${theme === t.id ? 'active' : ''}`}
                  onClick={() => setTheme(t.id)}
                >
                  <span className="theme-swatch" style={{ background: t.color }} />
                  {t.label}
                  {theme === t.id && <span className="theme-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Light/Dark quick toggle */}
        <button className="topbar-btn" onClick={toggleTheme} title="Toggle light/dark">
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Kiosk / fullscreen */}
        <button className="topbar-btn" onClick={toggleKiosk} title={kiosk ? 'Exit kiosk' : 'Kiosk mode'}>
          {kiosk ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>

        {/* Disconnect */}
        <button className="topbar-btn danger" onClick={disconnect} title="Disconnect">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
