import React, { useState, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { callService, hexToRgb, rgbToHex, formatEntityName } from '../api/homeAssistant'
import { Lightbulb, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import './DeviceCard.css'
import './LightCard.css'

export default function LightCard({ entityId, entity, onRemove }) {
  const { getBaseUrl, getToken } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const brightnessTimer = useRef(null)
  const colorTimer = useRef(null)

  const isOn = entity?.state === 'on'
  const isUnavailable = entity?.state === 'unavailable'
  const name = entity?.attributes?.friendly_name || formatEntityName(entityId)
  const brightness = entity?.attributes?.brightness ?? 255
  const brightnessPercent = Math.round((brightness / 255) * 100)
  const rgbColor = entity?.attributes?.rgb_color
  const currentColor = rgbColor ? rgbToHex(rgbColor) : '#ffffff'
  const modes = entity?.attributes?.supported_color_modes || []
  const supportsRgb = modes.some(m => ['rgb','rgbw','rgbww','hs','xy'].includes(m))
  const supportsColorTemp = modes.includes('color_temp')
  const colorTemp = entity?.attributes?.color_temp
  const minMireds = entity?.attributes?.min_mireds ?? 153
  const maxMireds = entity?.attributes?.max_mireds ?? 500

  // Dynamic glow color matching the bulb's current color
  const glowRgb = isOn && rgbColor ? rgbColor : [251, 191, 36]
  const glowAlpha = isOn ? 0.3 : 0
  const glowStyle = { '--glow-r': glowRgb[0], '--glow-g': glowRgb[1], '--glow-b': glowRgb[2], '--glow-a': glowAlpha }

  const toggle = async () => {
    if (pending || isUnavailable) return
    setPending(true)
    setError(null)
    try {
      await callService(getBaseUrl(), getToken(), 'light',
        isOn ? 'turn_off' : 'turn_on', { entity_id: entityId })
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(null), 3000)
    } finally {
      setPending(false)
    }
  }

  const handleBrightness = useCallback((e) => {
    const val = parseInt(e.target.value)
    clearTimeout(brightnessTimer.current)
    brightnessTimer.current = setTimeout(async () => {
      try {
        await callService(getBaseUrl(), getToken(), 'light', 'turn_on',
          { entity_id: entityId, brightness: Math.round((val / 100) * 255) })
      } catch {}
    }, 120)
  }, [entityId, getBaseUrl, getToken])

  const handleColor = useCallback((e) => {
    const hex = e.target.value
    clearTimeout(colorTimer.current)
    colorTimer.current = setTimeout(async () => {
      try {
        await callService(getBaseUrl(), getToken(), 'light', 'turn_on',
          { entity_id: entityId, rgb_color: hexToRgb(hex) })
      } catch {}
    }, 80)
  }, [entityId, getBaseUrl, getToken])

  const handleColorTemp = useCallback((e) => {
    const val = parseInt(e.target.value)
    clearTimeout(colorTimer.current)
    colorTimer.current = setTimeout(async () => {
      try {
        await callService(getBaseUrl(), getToken(), 'light', 'turn_on',
          { entity_id: entityId, color_temp: val })
      } catch {}
    }, 120)
  }, [entityId, getBaseUrl, getToken])

  return (
    <div className={`device-card light-card ${isOn ? 'on' : ''}`} style={glowStyle}>
      {/* Radial glow behind the card when ON */}
      <div className="light-aura" />

      {/* Header row */}
      <div className="device-card-header">
        <div className="device-card-info">
          <div className="device-card-name">{name}</div>
          <div className="device-card-id">{entityId}</div>
        </div>
        <button className="remove-btn" onClick={onRemove} title="Remove from room">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Icon + toggle */}
      <div className="light-body">
        <div className={`light-orb ${isOn ? 'on' : ''}`}
          style={isOn && rgbColor ? { '--orb-color': currentColor } : {}}>
          <Lightbulb size={26} strokeWidth={1.5} />
        </div>

        <div className="light-right">
          {isOn && <span className="brightness-label">{brightnessPercent}%</span>}
          <button
            className={`toggle-switch ${isOn ? 'on' : ''}`}
            onClick={toggle}
            disabled={pending || isUnavailable}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      {error && <div className="light-error">{error}</div>}

      {/* Brightness slider — always visible when on */}
      {isOn && (
        <div className="light-controls">
          <input
            type="range" min="1" max="100"
            defaultValue={brightnessPercent}
            key={`b-${brightnessPercent}`}
            onChange={handleBrightness}
            style={{
              background: `linear-gradient(to right, var(--accent) ${brightnessPercent}%, var(--border) ${brightnessPercent}%)`
            }}
          />

          {(supportsRgb || supportsColorTemp) && (
            <button className="expand-btn" onClick={() => setExpanded(v => !v)}>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Color
              {supportsRgb && isOn && (
                <span className="color-dot" style={{ background: currentColor }} />
              )}
            </button>
          )}

          {expanded && (
            <div className="color-expand">
              {supportsRgb && (
                <div className="color-row">
                  <label>Color</label>
                  <div className="color-pick-wrap">
                    <input type="color"
                      defaultValue={currentColor}
                      key={`c-${currentColor}`}
                      onChange={handleColor}
                      style={{ width: 32, height: 32 }}
                    />
                    <code>{currentColor}</code>
                  </div>
                </div>
              )}
              {supportsColorTemp && !supportsRgb && (
                <>
                  <div className="color-row">
                    <label>Color Temp</label>
                    <code>{colorTemp ? `${Math.round(1000000 / colorTemp)}K` : '—'}</code>
                  </div>
                  <div className="temp-slider-wrap">
                    <span>Warm</span>
                    <input type="range"
                      min={minMireds} max={maxMireds}
                      defaultValue={colorTemp ?? minMireds}
                      key={`t-${colorTemp}`}
                      onChange={handleColorTemp}
                      style={{ background: 'linear-gradient(to right, #ff9500, #fff5e0, #c9e8ff)' }}
                    />
                    <span>Cool</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {isUnavailable && <div className="unavail-badge">Unavailable</div>}
    </div>
  )
}
