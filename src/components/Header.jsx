import React from 'react'
import { useApp } from '../context/AppContext'
import { Menu, Plus, Sun, Moon, RefreshCw } from 'lucide-react'
import './Header.css'

export default function Header({ onToggleSidebar, onAddDevice }) {
  const { rooms, selectedRoom, theme, dispatch } = useApp()
  const room = rooms.find(r => r.id === selectedRoom)

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', theme: theme === 'dark' ? 'light' : 'dark' })
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-btn" onClick={onToggleSidebar} title="Toggle sidebar">
          <Menu size={20} />
        </button>
        {room && (
          <div className="header-title">
            <h2>{room.name}</h2>
            <span>{room.devices.length} device{room.devices.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <button className="header-btn accent" onClick={onAddDevice} title="Add device to room">
          <Plus size={18} />
          <span>Add Device</span>
        </button>
        <button className="header-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
