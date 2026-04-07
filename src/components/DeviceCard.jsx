import React from 'react'
import { useApp } from '../context/AppContext'
import { getEntityDomain, formatEntityName } from '../api/homeAssistant'
import LightCard from './LightCard'
import CameraCard from './CameraCard'
import SwitchCard from './SwitchCard'
import SensorCard from './SensorCard'
import ClimateCard from './ClimateCard'
import GenericCard from './GenericCard'
import { Trash2 } from 'lucide-react'
import './DeviceCard.css'

export default function DeviceCard({ entityId, roomId, entity }) {
  const { dispatch } = useApp()
  const domain = getEntityDomain(entityId)

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_DEVICE_FROM_ROOM', roomId, entityId })
  }

  const cardProps = { entityId, entity, onRemove: handleRemove }

  const renderCard = () => {
    switch (domain) {
      case 'light': return <LightCard {...cardProps} />
      case 'camera': return <CameraCard {...cardProps} />
      case 'switch':
      case 'input_boolean': return <SwitchCard {...cardProps} />
      case 'sensor':
      case 'binary_sensor': return <SensorCard {...cardProps} />
      case 'climate': return <ClimateCard {...cardProps} />
      default: return <GenericCard {...cardProps} />
    }
  }

  return renderCard()
}
