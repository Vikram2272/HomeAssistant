import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  DoorOpen, BedDouble, UtensilsCrossed, ChefHat, Sofa, Monitor,
  Car, Home, Plus, Trash2, Wifi, WifiOff, LogOut, Edit2, Check, X
} from 'lucide-react'
import './Sidebar.css'

const ICON_MAP = {
  'door-open': DoorOpen,
  'bed-double': BedDouble,
  utensils: UtensilsCrossed,
  'chef-hat': ChefHat,
  sofa: Sofa,
  monitor: Monitor,
  car: Car,
  home: Home,
}

function RoomIcon({ icon, size = 18 }) {
  const Icon = ICON_MAP[icon] || Home
  return <Icon size={size} strokeWidth={1.8} />
}

function RoomItem({ room, isSelected, onSelect, onRemove, onRename }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(room.name)

  const handleRename = () => {
    if (name.trim() && name !== room.name) onRename(room.id, name.trim())
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRename()
    if (e.key === 'Escape') { setName(room.name); setEditing(false) }
  }

  return (
    <div
      className={`room-item ${isSelected ? 'active' : ''}`}
      onClick={() => !editing && onSelect(room.id)}
    >
      <span className="room-icon">
        <RoomIcon icon={room.icon} />
      </span>
      {editing ? (
        <input
          className="room-rename-input"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="room-name">{room.name}</span>
      )}
      <span className="room-device-count">{room.devices.length}</span>
      <div className="room-actions" onClick={e => e.stopPropagation()}>
        {editing ? (
          <>
            <button onClick={handleRename} className="room-action-btn" title="Save">
              <Check size={13} />
            </button>
            <button onClick={() => { setName(room.name); setEditing(false) }} className="room-action-btn" title="Cancel">
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="room-action-btn" title="Rename">
              <Edit2 size={13} />
            </button>
            <button onClick={() => onRemove(room.id)} className="room-action-btn danger" title="Remove room">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Sidebar({ open, onAddRoom }) {
  const { rooms, selectedRoom, wsStatus, dispatch, disconnect } = useApp()

  const handleSelect = (id) => dispatch({ type: 'SELECT_ROOM', roomId: id })
  const handleRemove = (id) => {
    if (rooms.length <= 1) return
    if (confirm('Remove this room?')) dispatch({ type: 'REMOVE_ROOM', roomId: id })
  }
  const handleRename = (id, name) => dispatch({ type: 'RENAME_ROOM', roomId: id, name })

  const statusClass = wsStatus === 'connected' ? 'connected' : wsStatus === 'error' ? 'error' : 'disconnected'
  const StatusIcon = wsStatus === 'connected' ? Wifi : WifiOff

  return (
    <aside className={`sidebar ${open ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <Home size={20} strokeWidth={1.5} />
          {open && <span>HA Dashboard</span>}
        </div>
        <div className={`ws-indicator ${statusClass}`} title={`WebSocket: ${wsStatus}`}>
          <StatusIcon size={12} />
          {open && <span>{wsStatus}</span>}
        </div>
      </div>

      <div className="sidebar-rooms-label">
        {open && <span>Rooms</span>}
      </div>

      <nav className="sidebar-nav">
        {rooms.map(room => (
          <RoomItem
            key={room.id}
            room={room}
            isSelected={selectedRoom === room.id}
            onSelect={handleSelect}
            onRemove={handleRemove}
            onRename={handleRename}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-add-room" onClick={onAddRoom} title="Add room">
          <Plus size={16} />
          {open && <span>Add Room</span>}
        </button>
        <button className="sidebar-disconnect" onClick={disconnect} title="Disconnect">
          <LogOut size={16} />
          {open && <span>Disconnect</span>}
        </button>
      </div>
    </aside>
  )
}
