import React from 'react'
import { formatEntityName, getEntityDomain } from '../api/homeAssistant'
import { Cpu, Trash2 } from 'lucide-react'
import './DeviceCard.css'
import './GenericCard.css'

export default function GenericCard({ entityId, entity, onRemove }) {
  const name = entity?.attributes?.friendly_name || formatEntityName(entityId)
  const state = entity?.state || 'unknown'
  const domain = getEntityDomain(entityId)
  const unit = entity?.attributes?.unit_of_measurement || ''

  return (
    <div className="device-card generic-card">
      <div className="device-card-header">
        <div className="device-card-info">
          <div className="device-card-name">{name}</div>
          <div className="device-card-id">{entityId}</div>
        </div>
        <div className="device-card-actions">
          <span className="domain-badge">{domain}</span>
          <button className="remove-btn" onClick={onRemove} title="Remove from room">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="generic-body">
        <div className="generic-icon">
          <Cpu size={24} strokeWidth={1.5} />
        </div>
        <div className="generic-state">
          {state} {unit}
        </div>
      </div>
    </div>
  )
}
