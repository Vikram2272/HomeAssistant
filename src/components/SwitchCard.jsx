import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { callService, formatEntityName, getEntityDomain } from '../api/homeAssistant'
import { ToggleRight, Trash2, Zap } from 'lucide-react'
import './DeviceCard.css'
import './SwitchCard.css'

export default function SwitchCard({ entityId, entity, onRemove }) {
  const { getBaseUrl, getToken } = useApp()
  const [pending, setPending] = useState(false)

  const isOn = entity?.state === 'on'
  const isUnavailable = entity?.state === 'unavailable'
  const name = entity?.attributes?.friendly_name || formatEntityName(entityId)
  const domain = getEntityDomain(entityId)

  const toggle = async () => {
    if (pending || isUnavailable) return
    setPending(true)
    try {
      await callService(
        getBaseUrl(), getToken(),
        domain === 'input_boolean' ? 'input_boolean' : 'switch',
        isOn ? 'turn_off' : 'turn_on',
        { entity_id: entityId }
      )
    } catch (err) {
      console.error('Switch toggle failed:', err)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={`device-card switch-card ${isOn ? 'on' : ''}`}>
      <div className="device-card-header">
        <div className="device-card-info">
          <div className="device-card-name">{name}</div>
          <div className="device-card-id">{entityId}</div>
        </div>
        <div className="device-card-actions">
          <button className="remove-btn" onClick={onRemove} title="Remove from room">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="switch-body">
        <div className={`switch-icon ${isOn ? 'on' : ''}`}>
          <Zap size={28} strokeWidth={1.5} />
        </div>

        <div className="switch-right">
          <span className={`device-status-badge ${isOn ? 'on' : isUnavailable ? 'unavailable' : 'off'}`}>
            {isUnavailable ? 'unavailable' : isOn ? 'on' : 'off'}
          </span>
          <button
            className={`toggle-switch ${isOn ? 'on' : ''}`}
            onClick={toggle}
            disabled={pending || isUnavailable}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>
    </div>
  )
}
