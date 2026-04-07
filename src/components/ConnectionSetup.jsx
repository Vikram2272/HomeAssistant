import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Wifi, Lock, Server, Eye, EyeOff, AlertCircle, Loader, CheckCircle, Home } from 'lucide-react'
import './ConnectionSetup.css'

function validatePort(port) {
  if (!port) return null
  const n = Number(port)
  if (!Number.isInteger(n) || n < 1 || n > 65535) return 'Port must be a number between 1 and 65535'
  return null
}

export default function ConnectionSetup() {
  const { connect, loading, error, connection } = useApp()
  const [ip, setIp] = useState(connection.ip || '')
  const [port, setPort] = useState(connection.port || '8123')
  const [token, setToken] = useState(connection.token || '')
  const [showToken, setShowToken] = useState(false)
  const [touched, setTouched] = useState({ ip: false, port: false, token: false })

  const portError = touched.port ? validatePort(port) : null
  const ipError = touched.ip && !ip.trim() ? 'Host address is required' : null
  const tokenError = touched.token && !token.trim() ? 'Access token is required' : null
  const canSubmit = ip.trim() && token.trim() && !validatePort(port) && !loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ ip: true, port: true, token: true })
    if (!canSubmit) return
    await connect(ip.trim(), port.trim() || '8123', token.trim())
  }

  return (
    <div className="setup-wrapper">
      <div className="setup-bg">
        <div className="setup-bg-orb orb-1" />
        <div className="setup-bg-orb orb-2" />
        <div className="setup-bg-orb orb-3" />
      </div>

      <div className="setup-card">
        <div className="setup-logo">
          <div className="setup-logo-icon">
            <Home size={28} strokeWidth={1.5} />
          </div>
          <h1>Home Assistant</h1>
          <p>Connect to your local instance</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form" noValidate>
          <div className={`form-group ${ipError ? 'has-error' : ''}`}>
            <label htmlFor="ip">
              <Server size={13} />
              Host / IP Address
            </label>
            <input
              id="ip"
              type="text"
              value={ip}
              onChange={e => setIp(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, ip: true }))}
              placeholder="192.168.1.100 or homeassistant.local"
              autoComplete="off"
              spellCheck={false}
            />
            {ipError && <span className="field-error"><AlertCircle size={12} />{ipError}</span>}
          </div>

          <div className={`form-group ${portError ? 'has-error' : ''}`}>
            <label htmlFor="port">
              <Server size={13} />
              Port
            </label>
            <input
              id="port"
              type="text"
              value={port}
              onChange={e => setPort(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, port: true }))}
              placeholder="8123"
              autoComplete="off"
            />
            {portError && <span className="field-error"><AlertCircle size={12} />{portError}</span>}
          </div>

          <div className={`form-group ${tokenError ? 'has-error' : ''}`}>
            <label htmlFor="token">
              <Lock size={13} />
              Long-Lived Access Token
            </label>
            <div className="input-with-action">
              <input
                id="token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, token: true }))}
                placeholder="Paste your token here..."
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowToken(v => !v)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {tokenError
              ? <span className="field-error"><AlertCircle size={12} />{tokenError}</span>
              : <span className="form-hint">Profile → Security → Long-Lived Access Tokens → Create Token</span>
            }
          </div>

          {error && (
            <div className="setup-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="setup-btn" disabled={!canSubmit}>
            {loading ? (
              <>
                <Loader size={16} className="spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wifi size={16} />
                Connect
              </>
            )}
          </button>
        </form>

        <div className="setup-footer">
          <CheckCircle size={12} />
          <p>Credentials stored locally — never shared.</p>
        </div>
      </div>
    </div>
  )
}
