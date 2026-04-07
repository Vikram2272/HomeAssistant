export function buildBaseUrl(ip, port) {
  const cleanIp = ip.trim().replace(/\/$/, '')
  const proto = cleanIp.startsWith('http') ? '' : 'http://'
  return `${proto}${cleanIp}:${port}`
}

export async function fetchStates(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/states`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function callService(baseUrl, token, domain, service, data) {
  const res = await fetch(`${baseUrl}/api/services/${domain}/${service}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function fetchCameraSnapshot(baseUrl, token, entityId) {
  const res = await fetch(`${baseUrl}/api/camera_proxy/${entityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Camera fetch failed: ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [255, 255, 255]
}

export function rgbToHex(rgb) {
  if (!rgb || rgb.length < 3) return '#ffffff'
  return '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

export function kelvinToMireds(kelvin) {
  return Math.round(1000000 / kelvin)
}

export function miredsToKelvin(mireds) {
  return Math.round(1000000 / mireds)
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
