export function buildBaseUrl(ip, port) {
  let cleanIp = ip.trim().replace(/\/$/, '')
  if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
    cleanIp = 'http://' + cleanIp
  }
  try {
    const url = new URL(cleanIp)
    if (!url.port) url.port = port
    return url.origin
  } catch {
    return `${cleanIp}:${port}`
  }
}

function proxyFetch(baseUrl, token, path, init = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'X-HA-URL': baseUrl,
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
  }
  return fetch(`/ha-proxy${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } })
}

async function throwOnError(res) {
  if (res.ok) return
  let detail = ''
  try {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('json')) {
      const body = await res.json()
      detail = body.message || body.error || JSON.stringify(body)
    } else {
      detail = (await res.text()).slice(0, 200)
    }
  } catch {}
  throw new Error(`${res.status}${detail ? ': ' + detail : ''}`)
}

export async function fetchStates(baseUrl, token) {
  const res = await proxyFetch(baseUrl, token, '/api/states')
  await throwOnError(res)
  return res.json()
}

export async function callService(baseUrl, token, domain, service, data) {
  const res = await proxyFetch(baseUrl, token, `/api/services/${domain}/${service}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  await throwOnError(res)
  // HA may return empty body on some service calls
  const text = await res.text()
  if (!text.trim()) return []
  try { return JSON.parse(text) } catch { return [] }
}

export async function fetchCameraSnapshot(baseUrl, token, entityId, entityPicture) {
  // entity_picture is a pre-signed relative URL that works for Ring and other cloud cameras
  // e.g. /api/camera_proxy/camera.ring_front?token=xyz
  const paths = entityPicture
    ? [entityPicture, `/api/camera_proxy/${entityId}`]
    : [`/api/camera_proxy/${entityId}`]

  for (const path of paths) {
    try {
      const res = await proxyFetch(baseUrl, token, path)
      if (res.ok) {
        const blob = await res.blob()
        return URL.createObjectURL(blob)
      }
    } catch {}
  }
  throw new Error('Camera snapshot unavailable')
}

export function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [255, 255, 255]
}

export function rgbToHex(rgb) {
  if (!rgb || rgb.length < 3) return '#ffffff'
  return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

export function getEntityDomain(entityId) {
  return entityId.split('.')[0]
}

export function formatEntityName(entityId) {
  return entityId.split('.')[1].split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
