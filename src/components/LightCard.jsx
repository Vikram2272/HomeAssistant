import React, { useState, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { callService, hexToRgb, rgbToHex, formatEntityName } from '../api/homeAssistant'
import { Lightbulb, Trash2, Palette, ChevronDown, ChevronUp } from 'lucide-react'
import './DeviceCard.css'
import './LightCard.css'

export default function LightCard({ entityId, entity, onRemove }) {
  const { getBaseUrl, getToken } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [pending, setPending] = useState(false)
  const brightnessTimer = useRef(null)
  const colorTimer = useRef(null)

  const isOn = entity?.state === 'on'
  const isUnavailable = entity?.state === 'unavailable'
  const name = entity?.attributes?.friendly_name || formatEntityName(entityId)
  const brightness = entity?.attributes?.brightness ?? 255
  const brightnessPercent = Math.round((brightness / 255) * 100)
  const rgbColor = entity?.attributes?.rgb_color
  const currentColor = rgbColor ? rgbToHex(rgbColor) : '#ffffff'
  const supportsColor = entity?.attributes?.supported_color_modes?.some(
    m => ['rgb', 'rgbw', 'rgbww', 'hs', 'xy', 'color_temp'].includes(m)
  )
  const supportsColorTemp = entity?.attributes?.supported_color_modes?.includes('color_temp')
  const supportsRgb = entity?.attributes?.supported_color_modes?.some(
    m => ['rgb', 'rgbw', 'rgbww', 'hs', 'xy'].includes(m)
  )
  const colorTemp = entity?.attributes?.color_temp
  const minMireds = entity?.attributes?.min_mireds ?? 153
  const maxMireds = entity?.attributes?.max_mireds ?? 500

  const toggle = async () => {
    if (pending) return
    setPending(true)
    try {
      await callService(
        getBaseUrl(), getToken(),
        'light', isOn ? 'turn_off' : 'turn_on',
        { entity_id: entityId }
      )
    } catch (err) {
      console.error('Toggle failed:', err)
    } finally {
      setPending(false)
    }
  }

  const handleBrightness = useCallback((e) => {
    const val = parseInt(e.target.value)
    clearTimeout(brightnessTimer.current)
    brightnessTimer.current = setTimeout(async () => {
      try {
        await callService(getBaseUrl(), getToken(), 'light', 'turn_on', {
          entity_id: entityId,
          brightness: Math.round((val / 100) * 255),
        })
      } catch (err) {
        console.error('Brightness failed:', err)
      }
    }, 150)
  }, [entityId, getBaseUrl, getToken])

  const handleColor = useCallback((e) => {
    const hex = e.target.value
    clearTimeout(colorTimer.current)
    colorTimer.current = setTimeout(async () => {
      try {
        await callService(getBaseUrl(), getToken(), 'light', 'turn_on', {
          entity_id: entityId,
          rgb_color: hexToRgb(hex),
        })
      } catch (err) {
        console.error('Color change failed:', err)
      }
    }, 100)
  }, [entityId, getBaseUrl, getToken])

  const handleColorTemp = useCallback((e) => {
    const val = parseInt(e.target.value)
    clearTimeout(colorTimer.current)
    colorTimer.current = setTimeout(async () => {
      try {
        await callService(getBaseUrl(), getToken(), 'light', 'turn_on', {
          entity_id: entityId,
          color_temp: val,
        })
      } catch (err) {
        console.error('Color temp failed:', err)
      }
    }, 150)
  }, [entityId, getBaseUrl, getToken])

  const glowColor = isOn && rgbColor
    ? `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, 0.15)`
    : isOn ? 'var(--on-bg)' : 'transparent'

  return (
    <div className={`device-card light-card ${isOn ? 'on' : ''}`} style={{ '--glow': glowColor }}>
      {isOn && <div className="light-glow" />}

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

      <div className="light-main">
        <div className={`light-icon-wrap ${isOn ? 'on' : ''}`} style={isOn && rgbColor ? { color: currentColor } : {}}>
          <Lightbulb size={28} strokeWidth={1.5} />
        </div>

        <div className="light-toggle-row">
          <span className={`device-status-badge ${isOn ? 'on' : isUnavailable ? 'unavailable' : 'off'}`}>
            {isUnavailable ? 'unavailable' : isOn ? 'on' : 'off'}
          </span>
          <button
            className={`toggle-switch ${isOn ? 'on' : ''}`}
            onClick={toggle}
            disabled={pending || isUnavailable}
            aria-label={isOn ? 'Turn off' : 'Turn on'}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      {isOn && (
        <div className="light-controls">
          <div className="control-row">
            <span className="control-label">
              <Lightbulb size={12} />
              Brightness
            </span>
            <span className="control-value">{brightnessPercent}%</span>
          </div>
          <div className="brightness-slider-wrap">
            <input
              type="range"
              min="1"
              max="100"
              defaultValue={brightnessPercent}
              key={brightnessPercent}
              onChange={handleBrightness}
              style={{
                background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${brightnessPercent}%, var(--border) ${brightnessPercent}%, var(--border) 100%)`
              }}
            />
          </div>

          {(supportsRgb || supportsColorTemp) && (
            <button
              className="expand-btn"
              onClick={() => setExpanded(v => !v)}
            >
              <Palette size={14} />
              Color Options
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {expanded && (
            <div className="color-controls">
              {supportsRgb && (
                <div className="color-row">
                  <span className="control-label">
                    <Palette size={12} />
                    Color
                  </span>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      defaultValue={currentColor}
                      key={currentColor}
                      onChange={handleColor}
                      className="color-input"
                      style={{ width: 36, height: 36 }}
                    />
                    <span className="color-hex">{currentColor}</span>
                  </div>
                </div>
              )}

              {supportsColorTemp && !supportsRgb && (
                <div className="control-row">
                  <span className="control-label">Color Temp</span>
                  <span className="control-value">
                    {colorTemp ? `${Math.round(1000000 / colorTemp)}K` : '-'}
                  </span>
                </div>
              )}
              {supportsColorTemp && !supportsRgb && (
                <div className="brightness-slider-wrap">
                  <span className="temp-label">Warm</span>
                  <input
                    type="range"
                    min={minMireds}
                    max={maxMireds}
                    defaultValue={colorTemp || minMireds}
                    key={colorTemp}
                    onChange={handleColorTemp}
                    style={{
                      background: 'linear-gradient(to right, #ff8800, #ffffff, #9acdff)'
                    }}
                  />
                  <span className="temp-label">Cool</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
