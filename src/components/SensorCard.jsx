import React from 'react'
import { formatEntityName, getEntityDomain } from '../api/homeAssistant'
import { Thermometer, Droplets, Activity, Wind, Eye, Trash2 } from 'lucide-react'
import './DeviceCard.css'
import './SensorCard.css'

function getSensorIcon(entityId, attributes) {
  const id = entityId.toLowerCase()
  const dc = (attributes?.device_class || '').toLowerCase()

  if (dc === 'temperature' || id.includes('temp')) return Thermometer
  if (dc === 'humidity' || id.includes('humid')) return Droplets
  if (dc === 'motion' || id.includes('motion')) return Activity
  if (dc === 'air_quality' || id.includes('air')) return Wind
  return Eye
}

function getSensorColor(state, attributes) {
  const dc = attributes?.device_class
  if (dc === 'motion') return state === 'on' ? 'var(--warning)' : 'var(--text-muted)'
  return 'var(--accent)'
}

export default function SensorCard({ entityId, entity, onRemove }) {
  const name = entity?.attributes?.friendly_name || formatEntityName(entityId)
  const state = entity?.state
  const unit = entity?.attributes?.unit_of_measurement || ''
  const dc = entity?.attributes?.device_class
  const isUnavailable = state === 'unavailable'
  const isBinary = getEntityDomain(entityId) === 'binary_sensor'
  const Icon = getSensorIcon(entityId, entity?.attributes)
  const iconColor = getSensorColor(state, entity?.attributes)

  const displayValue = isBinary
    ? (state === 'on' ? 'Detected' : 'Clear')
    : (state && unit ? `${state} ${unit}` : state || '—')

  const isAlert = isBinary && state === 'on'

  return (
    <div className={`device-card sensor-card ${isAlert ? 'alert' : ''}`}>
      <div className="device-card-header">
        <div className="device-card-info">
          <div className="device-card-name">{name}</div>
          <div className="device-card-id">{entityId}</div>
        </div>
        <div className="device-card-actions">
          {dc && <span className="sensor-dc-badge">{dc.replace('_', ' ')}</span>}
          <button className="remove-btn" onClick={onRemove} title="Remove from room">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="sensor-body">
        <div className="sensor-icon" style={{ color: iconColor }}>
          <Icon size={32} strokeWidth={1.5} />
        </div>
        <div className="sensor-value-wrap">
          <div className={`sensor-value ${isAlert ? 'alert' : ''}`}>{displayValue}</div>
          {isUnavailable && <div className="sensor-unavail">Unavailable</div>}
        </div>
      </div>
    </div>
  )
}
