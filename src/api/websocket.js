let msgId = 1

export function createHaWebSocket({ baseUrl, token, onStateChange, onConnect, onDisconnect, onError }) {
  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/websocket'
  let ws = null
  let reconnectTimer = null
  let authenticated = false
  let destroyed = false

  function connect() {
    if (destroyed) return
    try {
      ws = new WebSocket(wsUrl)
    } catch (err) {
      onError?.(err)
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      // HA sends auth_required first
    }

    ws.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      if (msg.type === 'auth_required') {
        ws.send(JSON.stringify({ type: 'auth', access_token: token }))
      } else if (msg.type === 'auth_ok') {
        authenticated = true
        onConnect?.()
        // Subscribe to state_changed events
        ws.send(JSON.stringify({
          id: msgId++,
          type: 'subscribe_events',
          event_type: 'state_changed',
        }))
      } else if (msg.type === 'auth_invalid') {
        onError?.(new Error('Invalid authentication token'))
        destroy()
      } else if (msg.type === 'event' && msg.event?.event_type === 'state_changed') {
        const { entity_id, new_state } = msg.event.data
        onStateChange?.(entity_id, new_state)
      }
    }

    ws.onerror = () => {
      onError?.(new Error('WebSocket connection error'))
    }

    ws.onclose = () => {
      authenticated = false
      if (!destroyed) {
        onDisconnect?.()
        scheduleReconnect()
      }
    }
  }

  function scheduleReconnect() {
    if (destroyed) return
    reconnectTimer = setTimeout(() => {
      connect()
    }, 5000)
  }

  function destroy() {
    destroyed = true
    clearTimeout(reconnectTimer)
    if (ws) {
      ws.onclose = null
      ws.close()
      ws = null
    }
  }

  connect()
  return { destroy }
}
