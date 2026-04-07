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

// All REST calls route through the Vite dev-server proxy at /ha-proxy to avoid CORS.
function proxyFetch(baseUrl, token, path, init = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'X-HA-URL': baseUrl,
  }
  if (init.body) headers['Content-Type'] = 'application/json'
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
      const text = await res.text()
      detail = text.slice(0, 200)
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
  return res.json()
}

export async function fetchCameraSnapshot(baseUrl, token, entityId) {
  const res = await proxyFetch(baseUrl, token, `/api/camera_proxy/${entityId}`)
  if (!res.ok) throw new Error(`Camera fetch failed: ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255]
}

export function rgbToHex(rgb) {
  if (!rgb || rgb.length < 3) return '#ffffff'
  return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

export function getEntityDomain(entityId) {
  return entityId.split('.')[0]
}

export function formatEntityName(entityId) {
  return entityId
    .split('.')[1]
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
