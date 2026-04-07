import React from 'react'
import { useApp } from '../context/AppContext'
import { Home, Wifi, WifiOff, Plus, Sun, Moon, LogOut } from 'lucide-react'
import './TopBar.css'

export default function TopBar({ onAddRoom }) {
  const { rooms, theme, wsStatus, connection, dispatch, disconnect } = useApp()

  const toggleTheme = () =>
    dispatch({ type: 'SET_THEME', theme: theme === 'dark' ? 'light' : 'dark' })

  const scrollTo = (id) => {
    document.getElementById(`room-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  const isConnected = wsStatus === 'connected'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <Home size={18} strokeWidth={1.8} />
          <span>HA Dashboard</span>
        </div>

        <div className={`topbar-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{connection.ip}</span>
        </div>
      </div>

      <nav className="topbar-rooms">
        {rooms.map(room => (
          <button key={room.id} className="topbar-room-pill" onClick={() => scrollTo(room.id)}>
            {room.name}
          </button>
        ))}
      </nav>

      <div className="topbar-right">
        <button className="topbar-btn accent" onClick={onAddRoom}>
          <Plus size={15} />
          <span>Add Room</span>
        </button>
        <button className="topbar-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="topbar-btn danger" onClick={disconnect} title="Disconnect">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
