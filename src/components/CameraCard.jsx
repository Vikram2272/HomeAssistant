import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { fetchCameraSnapshot, formatEntityName } from '../api/homeAssistant'
import { Camera, RefreshCw, Trash2, Play, Pause, AlertTriangle } from 'lucide-react'
import './DeviceCard.css'
import './CameraCard.css'

export default function CameraCard({ entityId, entity, onRemove }) {
  const { getBaseUrl, getToken } = useApp()
  const [imgUrl, setImgUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const intervalRef = useRef(null)
  const currentBlobRef = useRef(null)

  const name = entity?.attributes?.friendly_name || formatEntityName(entityId)

  const fetchSnapshot = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = await fetchCameraSnapshot(getBaseUrl(), getToken(), entityId)
      if (currentBlobRef.current) URL.revokeObjectURL(currentBlobRef.current)
      currentBlobRef.current = url
      setImgUrl(url)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [entityId, getBaseUrl, getToken])

  const toggleStream = () => {
    if (streaming) {
      clearInterval(intervalRef.current)
      setStreaming(false)
    } else {
      setStreaming(true)
      fetchSnapshot()
      intervalRef.current = setInterval(fetchSnapshot, 2000)
    }
  }

  // Initial snapshot
  useEffect(() => {
    fetchSnapshot()
    return () => {
      clearInterval(intervalRef.current)
      if (currentBlobRef.current) URL.revokeObjectURL(currentBlobRef.current)
    }
  }, [entityId])

  const isUnavailable = entity?.state === 'unavailable'

  return (
    <div className="device-card camera-card">
      <div className="device-card-header">
        <div className="device-card-info">
          <div className="device-card-name">{name}</div>
          <div className="device-card-id">{entityId}</div>
        </div>
        <div className="device-card-actions">
          <span className={`device-status-badge ${isUnavailable ? 'unavailable' : 'on'}`}>
            {isUnavailable ? 'offline' : streaming ? 'live' : 'camera'}
          </span>
          <button className="remove-btn" onClick={onRemove} title="Remove from room">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="camera-preview">
        {imgUrl && !error ? (
          <img src={imgUrl} alt={name} className="camera-img" />
        ) : error ? (
          <div className="camera-error">
            <AlertTriangle size={24} />
            <span>{error}</span>
          </div>
        ) : (
          <div className="camera-placeholder">
            <Camera size={32} strokeWidth={1} />
            <span>Loading...</span>
          </div>
        )}
        {loading && <div className="camera-loading-overlay"><RefreshCw size={16} className="spin" /></div>}
        {streaming && <div className="live-badge">LIVE</div>}
      </div>

      {lastUpdate && (
        <div className="camera-timestamp">Last update: {lastUpdate}</div>
      )}

      <div className="camera-controls">
        <button className="camera-btn" onClick={fetchSnapshot} disabled={loading} title="Refresh snapshot">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
        <button
          className={`camera-btn ${streaming ? 'active' : ''}`}
          onClick={toggleStream}
          title={streaming ? 'Stop live view' : 'Start live view'}
        >
          {streaming ? <Pause size={14} /> : <Play size={14} />}
          {streaming ? 'Stop' : 'Live'}
        </button>
      </div>
    </div>
  )
}
