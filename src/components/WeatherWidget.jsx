import React, { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer } from 'lucide-react'

const WMO_ICONS = {
  0: { icon: Sun, label: 'Clear' },
  1: { icon: Sun, label: 'Mainly clear' },
  2: { icon: Cloud, label: 'Partly cloudy' },
  3: { icon: Cloud, label: 'Overcast' },
  45: { icon: Cloud, label: 'Foggy' },
  48: { icon: Cloud, label: 'Icy fog' },
  51: { icon: CloudRain, label: 'Light drizzle' },
  61: { icon: CloudRain, label: 'Light rain' },
  71: { icon: CloudSnow, label: 'Light snow' },
  80: { icon: CloudRain, label: 'Rain showers' },
  95: { icon: CloudRain, label: 'Thunderstorm' },
}

function getWeatherFromHA(entities) {
  const weatherEntity = Object.values(entities).find(e => e.entity_id.startsWith('weather.'))
  if (!weatherEntity) return null
  const a = weatherEntity.attributes
  const condMap = {
    sunny: Sun, partlycloudy: Cloud, cloudy: Cloud,
    rainy: CloudRain, snowy: CloudSnow, windy: Wind, fog: Cloud,
    hail: CloudRain, lightning: CloudRain, pouring: CloudRain,
  }
  const Icon = condMap[weatherEntity.state] || Cloud
  return {
    temp: a.temperature != null ? `${Math.round(a.temperature)}°` : null,
    label: weatherEntity.state.replace(/_/g, ' '),
    Icon,
  }
}

export default function WeatherWidget() {
  const { entities } = useApp()
  const [weather, setWeather] = useState(null)

  // Try HA weather entity first
  useEffect(() => {
    const ha = getWeatherFromHA(entities)
    if (ha) { setWeather(ha); return }

    // Fallback: Open-Meteo (no API key)
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
          .then(r => r.json())
          .then(d => {
            const cw = d.current_weather
            const entry = WMO_ICONS[cw.weathercode] || WMO_ICONS[0]
            setWeather({
              temp: `${Math.round(cw.temperature)}°`,
              label: entry.label,
              Icon: entry.icon,
            })
          })
          .catch(() => {})
      },
      () => {},
      { timeout: 5000 }
    )
  }, [entities])

  if (!weather) return null

  const { Icon, temp, label } = weather
  return (
    <div className="weather-widget" title={label}>
      <Icon size={15} strokeWidth={1.8} />
      {temp && <span>{temp}</span>}
    </div>
  )
}
