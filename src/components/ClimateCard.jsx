import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { callService, formatEntityName } from '../api/homeAssistant'
import { Thermometer, ChevronUp, ChevronDown, Trash2, Wind } from 'lucide-react'
import './DeviceCard.css'
import './ClimateCard.css'

export default function ClimateCard({ entityId, entity, onRemove }) {
  const { getBaseUrl, getToken } = useApp()
  const [pending, setPending] = useState(false)

  const name = entity?.attributes?.friendly_name || formatEntityName(entityId)
  const hvacMode = entity?.state || 'off'
  const currentTemp = entity?.attributes?.current_temperature
  const targetTemp = entity?.attributes?.temperature
  const minTemp = entity?.attributes?.min_temp ?? 15
  const maxTemp = entity?.attributes?.max_temp ?? 35
  const unit = entity?.attributes?.temperature_unit || '°C'
  const hvacModes = entity?.attributes?.hvac_modes || []

  const isOff = hvacMode === 'off'

  const setTemp = async (delta) => {
    if (pending || isOff) return
    const newTemp = (targetTemp || currentTemp || 20) + delta
    if (newTemp < minTemp || newTemp > maxTemp) return
    setPending(true)
    try {
      await callService(getBaseUrl(), getToken(), 'climate', 'set_temperature', {
        entity_id: entityId,
        temperature: newTemp,
      })
    } catch (err) {
      console.error('Climate control failed:', err)
    } finally {
      setPending(false)
    }
  }

  const setMode = async (mode) => {
    if (pending) return
    setPending(true)
    try {
      await callService(getBaseUrl(), getToken(), 'climate', 'set_hvac_mode', {
        entity_id: entityId,
        hvac_mode: mode,
      })
    } catch (err) {
      console.error('Mode change failed:', err)
    } finally {
      setPending(false)
    }
  }

  const modeColor = {
    heat: '#ef4444',
    cool: '#3b82f6',
    heat_cool: '#8b5cf6',
    auto: '#10b981',
    dry: '#f59e0b',
    fan_only: '#6b7280',
    off: undefined,
  }

  return (
    <div className={`device-card climate-card ${isOff ? '' : 'on'}`}>
      <div className="device-card-header">
        <div className="device-card-info">
          <div className="device-card-name">{name}</div>
          <div className="device-card-id">{entityId}</div>
        </div>
        <div className="device-card-actions">
          <span
            className="device-status-badge"
            style={modeColor[hvacMode] ? {
              background: `${modeColor[hvacMode]}22`,
              color: modeColor[hvacMode]
            } : {}}
          >
            {hvacMode}
          </span>
          <button className="remove-btn" onClick={onRemove} title="Remove from room">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="climate-body">
        <div className="climate-temps">
          <div className="climate-current">
            <Thermometer size={14} />
            <span>{currentTemp != null ? `${currentTemp}${unit}` : '—'}</span>
            <span className="climate-label">Current</span>
          </div>
          <div className="climate-target">
            <span className="target-value">
              {targetTemp != null ? `${targetTemp}${unit}` : '—'}
            </span>
            <div className="target-controls">
              <button
                className="temp-btn"
                onClick={() => setTemp(0.5)}
                disabled={pending || isOff}
              >
                <ChevronUp size={16} />
              </button>
              <button
                className="temp-btn"
                onClick={() => setTemp(-0.5)}
                disabled={pending || isOff}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>

        {hvacModes.length > 0 && (
          <div className="climate-modes">
            {hvacModes.map(mode => (
              <button
                key={mode}
                className={`mode-btn ${hvacMode === mode ? 'active' : ''}`}
                onClick={() => setMode(mode)}
                disabled={pending}
                style={hvacMode === mode && modeColor[mode] ? {
                  background: `${modeColor[mode]}22`,
                  color: modeColor[mode],
                  borderColor: `${modeColor[mode]}44`,
                } : {}}
              >
                {mode === 'off' ? 'Off' : mode.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
