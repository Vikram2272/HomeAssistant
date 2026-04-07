import React from 'react'
import { useApp } from '../context/AppContext'
import DeviceCard from './DeviceCard'
import { Plus, LayoutGrid } from 'lucide-react'
import './RoomView.css'

export default function RoomView({ onAddDevice }) {
  const { rooms, selectedRoom, entities } = useApp()
  const room = rooms.find(r => r.id === selectedRoom)

  if (!room) {
    return (
      <div className="room-empty-state">
        <LayoutGrid size={48} strokeWidth={1} />
        <h3>Select a room</h3>
        <p>Choose a room from the sidebar to view devices.</p>
      </div>
    )
  }

  if (room.devices.length === 0) {
    return (
      <div className="room-empty-state">
        <Plus size={48} strokeWidth={1} />
        <h3>No devices in {room.name}</h3>
        <p>Add devices from your Home Assistant instance.</p>
        <button className="add-device-cta" onClick={onAddDevice}>
          <Plus size={16} />
          Add Device
        </button>
      </div>
    )
  }

  return (
    <div className="room-view">
      <div className="devices-grid">
        {room.devices.map(entityId => (
          <DeviceCard
            key={entityId}
            entityId={entityId}
            roomId={room.id}
            entity={entities[entityId]}
          />
        ))}
      </div>
    </div>
  )
}
