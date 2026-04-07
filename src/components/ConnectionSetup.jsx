import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Wifi, Lock, Server, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react'
import './ConnectionSetup.css'

export default function ConnectionSetup() {
  const { connect, loading, error, connection } = useApp()
  const [ip, setIp] = useState(connection.ip || '')
  const [port, setPort] = useState(connection.port || '8123')
  const [token, setToken] = useState(connection.token || '')
  const [showToken, setShowToken] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ip.trim() || !token.trim()) return
    await connect(ip.trim(), port.trim() || '8123', token.trim())
  }

  return (
    <div className="setup-wrapper">
      <div className="setup-bg" />
      <div className="setup-card">
        <div className="setup-logo">
          <div className="setup-logo-icon">
            <Wifi size={32} strokeWidth={1.5} />
          </div>
          <h1>Home Assistant</h1>
          <p>Connect to your local instance</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="ip">
              <Server size={14} />
              Host / IP Address
            </label>
            <input
              id="ip"
              type="text"
              value={ip}
              onChange={e => setIp(e.target.value)}
              placeholder="192.168.1.100"
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="port">
              <Server size={14} />
              Port
            </label>
            <input
              id="port"
              type="text"
              value={port}
              onChange={e => setPort(e.target.value)}
              placeholder="8123"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="token">
              <Lock size={14} />
              Long-Lived Access Token
            </label>
            <div className="input-with-action">
              <input
                id="token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste your token here..."
                autoComplete="off"
                spellCheck={false}
                required
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowToken(v => !v)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="form-hint">
              Profile → Security → Long-Lived Access Tokens → Create Token
            </span>
          </div>

          {error && (
            <div className="setup-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="setup-btn" disabled={loading || !ip || !token}>
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
          <p>Your credentials are stored locally and never shared.</p>
        </div>
      </div>
    </div>
  )
}
