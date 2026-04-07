import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatEntityName, getEntityDomain } from '../api/homeAssistant'
import {
  X, Search, Lightbulb, Camera, ToggleRight, Thermometer,
  Activity, Cpu, Wind, Check, Plus
} from 'lucide-react'
import './Modal.css'
import './AddDeviceModal.css'

const DOMAIN_ICONS = {
  light: Lightbulb,
  camera: Camera,
  switch: ToggleRight,
  input_boolean: ToggleRight,
  climate: Thermometer,
  sensor: Activity,
  binary_sensor: Activity,
  fan: Wind,
}

const DOMAIN_LABELS = {
  light: 'Lights',
  camera: 'Cameras',
  switch: 'Switches',
  input_boolean: 'Input Boolean',
  climate: 'Climate',
  sensor: 'Sensors',
  binary_sensor: 'Binary Sensors',
  fan: 'Fans',
}

const FILTER_DOMAINS = ['all', 'light', 'camera', 'switch', 'climate', 'sensor', 'binary_sensor', 'fan']

export default function AddDeviceModal({ onClose, overrideRoomId }) {
  const { entities, rooms, dispatch } = useApp()
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [added, setAdded] = useState(new Set())

  const currentRoom = rooms.find(r => r.id === overrideRoomId)
  const existingDevices = new Set(currentRoom?.devices || [])

  const allEntities = useMemo(() => {
    return Object.values(entities).map(e => ({
      entity_id: e.entity_id,
      name: e.attributes?.friendly_name || formatEntityName(e.entity_id),
      domain: getEntityDomain(e.entity_id),
      state: e.state,
    }))
  }, [entities])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allEntities.filter(e => {
      if (domainFilter !== 'all' && e.domain !== domainFilter) return false
      if (q && !e.name.toLowerCase().includes(q) && !e.entity_id.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name))
  }, [allEntities, search, domainFilter])

  const handleAdd = (entityId) => {
    if (!overrideRoomId) return
    dispatch({ type: 'ADD_DEVICE_TO_ROOM', roomId: overrideRoomId, entityId })
    setAdded(prev => new Set([...prev, entityId]))
  }

  const handleRemove = (entityId) => {
    if (!overrideRoomId) return
    dispatch({ type: 'REMOVE_DEVICE_FROM_ROOM', roomId: overrideRoomId, entityId })
    setAdded(prev => { const s = new Set(prev); s.delete(entityId); return s })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Add Devices</h2>
            <p>{currentRoom ? `Adding to: ${currentRoom.name}` : 'No room selected'}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search entities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="domain-filters">
          {FILTER_DOMAINS.map(d => (
            <button
              key={d}
              className={`domain-filter-btn ${domainFilter === d ? 'active' : ''}`}
              onClick={() => setDomainFilter(d)}
            >
              {d === 'all' ? 'All' : DOMAIN_LABELS[d] || d}
            </button>
          ))}
        </div>

        <div className="entity-list">
          {filtered.length === 0 ? (
            <div className="entity-empty">
              <Search size={28} strokeWidth={1} />
              <span>No entities found</span>
            </div>
          ) : (
            filtered.map(e => {
              const Icon = DOMAIN_ICONS[e.domain] || Cpu
              const isInRoom = existingDevices.has(e.entity_id) || added.has(e.entity_id)
              const justAdded = added.has(e.entity_id)

              return (
                <div key={e.entity_id} className={`entity-row ${isInRoom ? 'in-room' : ''}`}>
                  <div className="entity-row-icon">
                    <Icon size={16} strokeWidth={1.8} />
                  </div>
                  <div className="entity-row-info">
                    <span className="entity-row-name">{e.name}</span>
                    <span className="entity-row-id">{e.entity_id}</span>
                  </div>
                  <div className="entity-row-right">
                    <span className={`entity-state ${e.state === 'on' ? 'on' : ''}`}>
                      {e.state}
                    </span>
                    {isInRoom ? (
                      <button
                        className="entity-action-btn remove"
                        onClick={() => handleRemove(e.entity_id)}
                        title="Remove from room"
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <button
                        className="entity-action-btn add"
                        onClick={() => handleAdd(e.entity_id)}
                        title="Add to room"
                      >
                        <Plus size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="modal-footer">
          <span className="entity-count">{filtered.length} entities</span>
          <button className="modal-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
