import React, { useState } from 'react'
import TopBar from './TopBar'
import RoomSection from './RoomSection'
import AddDeviceModal from './AddDeviceModal'
import AddRoomModal from './AddRoomModal'
import { useApp } from '../context/AppContext'
import { LayoutGrid } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { rooms } = useApp()
  const [addDeviceRoomId, setAddDeviceRoomId] = useState(null)
  const [addRoomOpen, setAddRoomOpen] = useState(false)

  return (
    <div className="dashboard">
      <TopBar onAddRoom={() => setAddRoomOpen(true)} />

      <main className="dashboard-main">
        {rooms.length === 0 ? (
          <div className="page-empty">
            <LayoutGrid size={48} strokeWidth={1} />
            <h3>No rooms yet</h3>
            <p>Add a room to get started.</p>
          </div>
        ) : (
          rooms.map(room => (
            <RoomSection
              key={room.id}
              room={room}
              onAddDevice={() => setAddDeviceRoomId(room.id)}
            />
          ))
        )}
      </main>

      {addDeviceRoomId && (
        <AddDeviceModal
          overrideRoomId={addDeviceRoomId}
          onClose={() => setAddDeviceRoomId(null)}
        />
      )}
      {addRoomOpen && (
        <AddRoomModal onClose={() => setAddRoomOpen(false)} />
      )}
    </div>
  )
}
