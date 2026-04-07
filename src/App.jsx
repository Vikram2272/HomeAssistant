import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import ConnectionSetup from './components/ConnectionSetup'
import Dashboard from './components/Dashboard'

function AppInner() {
  const { connection } = useApp()
  return connection.isConnected ? <Dashboard /> : <ConnectionSetup />
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
