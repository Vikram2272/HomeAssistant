import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import DeviceCard from './DeviceCard'
import {
  DoorOpen, BedDouble, UtensilsCrossed, ChefHat, Sofa,
  Monitor, Car, Home, Bath, Trees, Dumbbell, Baby, Music,
  Plus, Trash2, Edit2, Check, X
} from 'lucide-react'
import './RoomSection.css'

const ICON_MAP = {
  'door-open': DoorOpen, 'bed-double': BedDouble, utensils: UtensilsCrossed,
  'chef-hat': ChefHat, sofa: Sofa, monitor: Monitor, car: Car, home: Home,
  bath: Bath, trees: Trees, dumbbell: Dumbbell, baby: Baby, music: Music,
}

function RoomIcon({ icon }) {
  const Icon = ICON_MAP[icon] || Home
  return <Icon size={18} strokeWidth={1.8} />
}

export default function RoomSection({ room, onAddDevice }) {
  const { entities, dispatch, rooms } = useApp()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(room.name)

  const handleRename = () => {
    if (name.trim() && name !== room.name)
      dispatch({ type: 'RENAME_ROOM', roomId: room.id, name: name.trim() })
    setEditing(false)
  }

  const handleRemoveRoom = () => {
    if (rooms.length <= 1) return
    if (confirm(`Remove "${room.name}" and all its devices from the dashboard?`))
      dispatch({ type: 'REMOVE_ROOM', roomId: room.id })
  }

  return (
    <section id={`room-${room.id}`} className="room-section">
      <div className="room-section-header">
        <div className="room-section-title">
          <span className="room-section-icon"><RoomIcon icon={room.icon} /></span>

          {editing ? (
            <input
              className="room-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setName(room.name); setEditing(false) }
              }}
              autoFocus
            />
          ) : (
            <h2 className="room-section-name">{room.name}</h2>
          )}

          <span className="room-device-count">
            {room.devices.length} {room.devices.length === 1 ? 'device' : 'devices'}
          </span>
        </div>

        <div className="room-section-actions">
          {editing ? (
            <>
              <button className="room-hdr-btn" onClick={handleRename} title="Save"><Check size={14} /></button>
              <button className="room-hdr-btn" onClick={() => { setName(room.name); setEditing(false) }} title="Cancel"><X size={14} /></button>
            </>
          ) : (
            <>
              <button className="room-hdr-btn" onClick={() => setEditing(true)} title="Rename room"><Edit2 size={14} /></button>
              <button className="room-hdr-btn danger" onClick={handleRemoveRoom} title="Remove room"><Trash2 size={14} /></button>
            </>
          )}
          <button className="room-add-btn" onClick={onAddDevice}>
            <Plus size={14} />
            Add Device
          </button>
        </div>
      </div>

      {room.devices.length === 0 ? (
        <div className="room-empty">
          <button className="room-empty-cta" onClick={onAddDevice}>
            <Plus size={15} />
            Add your first device to {room.name}
          </button>
        </div>
      ) : (
        <div className="room-devices-grid">
          {room.devices.map(entityId => (
            <DeviceCard
              key={entityId}
              entityId={entityId}
              roomId={room.id}
              entity={entities[entityId]}
            />
          ))}
        </div>
      )}
    </section>
  )
}
