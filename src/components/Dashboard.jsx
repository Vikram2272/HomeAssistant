import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import RoomView from './RoomView'
import AddDeviceModal from './AddDeviceModal'
import AddRoomModal from './AddRoomModal'
import './Dashboard.css'

export default function Dashboard() {
  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <Sidebar
        open={sidebarOpen}
        onAddRoom={() => setAddRoomOpen(true)}
      />
      <div className="dashboard-main">
        <Header
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          onAddDevice={() => setAddDeviceOpen(true)}
        />
        <div className="dashboard-content">
          <RoomView onAddDevice={() => setAddDeviceOpen(true)} />
        </div>
      </div>

      {addDeviceOpen && (
        <AddDeviceModal onClose={() => setAddDeviceOpen(false)} />
      )}
      {addRoomOpen && (
        <AddRoomModal onClose={() => setAddRoomOpen(false)} />
      )}
    </div>
  )
}
