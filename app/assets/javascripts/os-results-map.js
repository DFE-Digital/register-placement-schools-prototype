(() => {
  const mapElement = document.getElementById('results-map')
  if (!mapElement || typeof window.L === 'undefined') return

  const pointsElement = document.getElementById('os-map-points')
  if (!pointsElement) return

  let points = []
  try {
    points = JSON.parse(pointsElement.textContent)
  } catch (error) {
    return
  }

  if (!Array.isArray(points) || !points.length) return

  const apiKey = mapElement.dataset.osApiKey
  if (!apiKey) return

  const statusColors = {
    open: '#cfe4dc',
    closed: '#f4d7d7',
    'open, but proposed to close': '#fde4d7',
    'proposed to open': '#ffee80'
  }

  const statusAccents = {
    open: '#00703c',
    closed: '#d4351c',
    'open, but proposed to close': '#f47738',
    'proposed to open': '#ffdd00'
  }

  const buildPinIcon = (color, accent) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
        <path d="M14 40c-0.5 0-1-0.2-1.3-0.6C10.7 36.7 2 25.3 2 16 2 7.2 7.8 1 14 1s12 6.2 12 15c0 9.3-8.7 20.7-10.7 23.4-0.3 0.4-0.8 0.6-1.3 0.6z" fill="${color}" stroke="${accent}" stroke-width="1.5"/>
        <circle cx="14" cy="15" r="5" fill="${accent}"/>
      </svg>
    `

    return window.L.icon({
      iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -36]
    })
  }

  const iconCache = new Map()
  const getStatusIcon = (status) => {
    const key = (status || '').toLowerCase()
    const color = statusColors[key] || '#b1b4b6'
    const accent = statusAccents[key] || '#0b0c0c'
    const cacheKey = `${color}|${accent}`
    if (!iconCache.has(cacheKey)) {
      iconCache.set(cacheKey, buildPinIcon(color, accent))
    }
    return iconCache.get(cacheKey)
  }

  const map = window.L.map(mapElement, {
    scrollWheelZoom: false
  })

  window.L.tileLayer(
    `https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=${apiKey}`,
    {
      maxZoom: 20,
      attribution:
        '&copy; Crown copyright and database rights 2026 Ordnance Survey'
    }
  ).addTo(map)

  const bounds = window.L.latLngBounds()

  points.forEach((point) => {
    if (typeof point.lat !== 'number' || typeof point.lon !== 'number') return

    const marker = window.L.marker([point.lat, point.lon], {
      icon: getStatusIcon(point.status)
    }).addTo(map)
    if (point.name) {
      marker.bindPopup(point.name)
    }
    bounds.extend([point.lat, point.lon])
  })

  if (points.length === 1) {
    map.setView([points[0].lat, points[0].lon], 13)
  } else if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [20, 20] })
  } else {
    map.setView([points[0].lat, points[0].lon], 12)
  }
})()
