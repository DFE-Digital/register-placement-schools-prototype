const BASE_URL = 'https://api.os.uk/search/names/v1/find'

/**
 * Returns the Ordnance Survey API key from environment variables.
 * Throws if not set.
 *
 * @returns {string}
 */
const getOrdnanceSurveyApiKey = () => {
  const apiKey = process.env.ORDNANCE_SURVEY_API_KEY
  if (!apiKey) {
    throw new Error('Ordnance Survey API key not set in environment variables.')
  }
  return apiKey
}

/**
 * Performs a fetch request and returns parsed JSON, or null if request fails.
 *
 * @param {string | URL} url
 * @returns {Promise<object|null>}
 */
const safeFetchJson = async (url) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Fetch failed: ${response.status} ${response.statusText}`)
      return null
    }
    return await response.json()
  } catch (err) {
    console.error('Fetch threw an error:', err)
    return null
  }
}

const toRadians = (deg) => deg * (Math.PI / 180)
const toDegrees = (rad) => rad * (180 / Math.PI)

/**
 * Converts OSGB36 eastings/northings to WGS84 lat/lng.
 *
 * @param {number} easting
 * @param {number} northing
 * @returns {{lat: number, lng: number} | null}
 */
const bngToWgs84 = (easting, northing) => {
  const E = Number(easting)
  const N = Number(northing)
  if (!Number.isFinite(E) || !Number.isFinite(N)) return null

  const a = 6377563.396
  const b = 6356256.909
  const F0 = 0.9996012717
  const lat0 = toRadians(49)
  const lon0 = toRadians(-2)
  const N0 = -100000
  const E0 = 400000
  const e2 = 1 - (b * b) / (a * a)
  const n = (a - b) / (a + b)

  let lat = lat0
  let M = 0

  do {
    lat = (N - N0 - M) / (a * F0) + lat
    const latMinusLat0 = lat - lat0
    const latPlusLat0 = lat + lat0
    M = b * F0 * (
      (1 + n + (5 / 4) * n ** 2 + (5 / 4) * n ** 3) * latMinusLat0 -
      (3 * n + 3 * n ** 2 + (21 / 8) * n ** 3) * Math.sin(latMinusLat0) * Math.cos(latPlusLat0) +
      ((15 / 8) * n ** 2 + (15 / 8) * n ** 3) * Math.sin(2 * latMinusLat0) * Math.cos(2 * latPlusLat0) -
      (35 / 24) * n ** 3 * Math.sin(3 * latMinusLat0) * Math.cos(3 * latPlusLat0)
    )
  } while (N - N0 - M >= 0.00001)

  const sinLat = Math.sin(lat)
  const cosLat = Math.cos(lat)
  const tanLat = Math.tan(lat)
  const nu = a * F0 / Math.sqrt(1 - e2 * sinLat * sinLat)
  const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinLat * sinLat, 1.5)
  const eta2 = nu / rho - 1
  const dE = E - E0

  const VII = tanLat / (2 * rho * nu)
  const VIII = tanLat / (24 * rho * nu ** 3) * (5 + 3 * tanLat ** 2 + eta2 - 9 * tanLat ** 2 * eta2)
  const IX = tanLat / (720 * rho * nu ** 5) * (61 + 90 * tanLat ** 2 + 45 * tanLat ** 4)
  const X = 1 / (cosLat * nu)
  const XI = 1 / (6 * cosLat * nu ** 3) * (nu / rho + 2 * tanLat ** 2)
  const XII = 1 / (120 * cosLat * nu ** 5) * (5 + 28 * tanLat ** 2 + 24 * tanLat ** 4)
  const XIIA = 1 / (5040 * cosLat * nu ** 7) * (61 + 662 * tanLat ** 2 + 1320 * tanLat ** 4 + 720 * tanLat ** 6)

  const latOsgb = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6
  const lonOsgb = lon0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7

  // Convert OSGB36 to WGS84 using Helmert transform
  const aWgs = 6378137
  const bWgs = 6356752.3141
  const e2Wgs = 1 - (bWgs * bWgs) / (aWgs * aWgs)

  const v = a / Math.sqrt(1 - e2 * Math.sin(latOsgb) ** 2)
  const x1 = v * Math.cos(latOsgb) * Math.cos(lonOsgb)
  const y1 = v * Math.cos(latOsgb) * Math.sin(lonOsgb)
  const z1 = (v * (1 - e2)) * Math.sin(latOsgb)

  const tx = 446.448
  const ty = -125.157
  const tz = 542.060
  const s = 20.4894e-6
  const rx = toRadians(0.1502 / 3600)
  const ry = toRadians(0.2470 / 3600)
  const rz = toRadians(0.8421 / 3600)

  const x2 = tx + (1 + s) * x1 + (-rz) * y1 + (ry) * z1
  const y2 = ty + (rz) * x1 + (1 + s) * y1 + (-rx) * z1
  const z2 = tz + (-ry) * x1 + (rx) * y1 + (1 + s) * z1

  const p = Math.sqrt(x2 * x2 + y2 * y2)
  let latWgs = Math.atan2(z2, p * (1 - e2Wgs))
  let latPrev = 0
  while (Math.abs(latWgs - latPrev) > 1e-12) {
    latPrev = latWgs
    const vWgs = aWgs / Math.sqrt(1 - e2Wgs * Math.sin(latWgs) ** 2)
    latWgs = Math.atan2(z2 + e2Wgs * vWgs * Math.sin(latWgs), p)
  }
  const lonWgs = Math.atan2(y2, x2)

  return {
    lat: toDegrees(latWgs),
    lng: toDegrees(lonWgs)
  }
}

/**
 * Returns true when the input is a full UK postcode.
 *
 * @param {string} value
 * @returns {boolean}
 */
const looksLikePostcode = (value) => {
  const compact = value ? value.replace(/\s+/g, '').toUpperCase() : ''
  if (!compact) return false
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)
}

/**
 * Returns true when the input looks like a UK outward postcode.
 *
 * @param {string} value
 * @returns {boolean}
 */
const looksLikePostcodeOutward = (value) => {
  const compact = value ? value.replace(/\s+/g, '').toUpperCase() : ''
  if (!compact) return false
  return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(compact)
}

/**
 * Encodes OS Names result data into a place ID.
 *
 * @param {{name: string, lat: number, lng: number}} payload
 * @returns {string}
 */
const encodeNamesPlaceId = (payload) => {
  const json = JSON.stringify(payload)
  return `names:${Buffer.from(json).toString('base64')}`
}

/**
 * Decodes an OS Names place ID back into a name + geometry payload.
 *
 * @param {string} value
 * @returns {{name: string, geometry: { location: { lat: number, lng: number }}} | null}
 */
const decodeNamesPlaceId = (value) => {
  if (!value || typeof value !== 'string') return null
  if (!value.startsWith('names:')) return null
  try {
    const raw = value.slice('names:'.length)
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    if (!parsed || typeof parsed !== 'object') return null
    const lat = Number(parsed.lat)
    const lng = Number(parsed.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    const name = typeof parsed.name === 'string' ? parsed.name : ''
    return {
      name,
      geometry: { location: { lat, lng } }
    }
  } catch (err) {
    return null
  }
}

/**
 * Builds a display label for an OS Names entry.
 *
 * @param {object} entry
 * @returns {string}
 */
const buildLabel = (entry = {}) => {
  const name = entry.NAME1 ? entry.NAME1.trim() : ''
  const populated = entry.POPULATED_PLACE ? entry.POPULATED_PLACE.trim() : ''

  let label = name
  if (populated && populated.toLowerCase() !== name.toLowerCase()) {
    label = `${name}, ${populated}`
  }

  if (label && !label.toLowerCase().endsWith(', uk')) {
    label = `${label}, UK`
  }

  return label
}

/**
 * Normalises text for comparison (trim + lowercase).
 *
 * @param {string} value
 * @returns {string}
 */
const normaliseText = (value) => {
  if (!value || !value.trim()) return ''
  return value.trim().toLowerCase()
}

/**
 * Returns true when value starts with query (case-insensitive).
 *
 * @param {string} value
 * @param {string} query
 * @returns {boolean}
 */
const startsWithText = (value, query) => {
  const text = normaliseText(value)
  const q = normaliseText(query)
  if (!text || !q) return false
  return text.startsWith(q)
}

/**
 * Returns true when value equals query (case-insensitive).
 *
 * @param {string} value
 * @param {string} query
 * @returns {boolean}
 */
const isExactText = (value, query) => {
  const text = normaliseText(value)
  const q = normaliseText(query)
  if (!text || !q) return false
  return text === q
}

/**
 * Returns true when NAME1 or POPULATED_PLACE starts with the query.
 *
 * @param {object} entry
 * @param {string} query
 * @returns {boolean}
 */
const matchesNameOrPopulatedPlace = (entry = {}, query = '') => {
  return (
    startsWithText(entry.NAME1, query) ||
    startsWithText(entry.POPULATED_PLACE, query)
  )
}

/**
 * Scores an OS Names entry for ordering in suggestions.
 *
 * @param {object} entry
 * @param {string} query
 * @returns {number}
 */
const scoreEntry = (entry = {}, query = '') => {
  let score = 0
  if (isExactText(entry.NAME1, query)) score += 200
  if (startsWithText(entry.NAME1, query)) score += 120
  if (isExactText(entry.POPULATED_PLACE, query)) score += 80
  if (startsWithText(entry.POPULATED_PLACE, query)) score += 60

  const matchScore = Number(entry.MATCH)
  if (Number.isFinite(matchScore)) {
    score += Math.round(matchScore * 100)
  }

  return score
}

/**
 * De-duplicates results by description label (case-insensitive).
 *
 * @param {Array<{description: string}>} items
 * @returns {Array<{description: string}>}
 */
const dedupeByLabel = (items) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = item.description.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Returns OS Names suggestions for a query.
 *
 * @param {string} input
 * @param {object} [options]
 * @param {number} [options.maxresults=50]
 * @param {number} [options.suggestionLimit=10]
 * @returns {Promise<Array<{description: string, place_id: string}>>}
 */
const getNameSuggestions = async (input, options = {}) => {
  if (!input || !input.trim()) return []

  const maxresults = options.maxresults ?? 50
  const suggestionLimit = options.suggestionLimit ?? 10
  const query = input.trim()

  const isPostcodeQuery = looksLikePostcode(query) || looksLikePostcodeOutward(query)
  const localTypes = isPostcodeQuery
    ? ['Postcode']
    : ['City', 'Town', 'Village', 'Hamlet', 'Suburban_Area', 'Other_Settlement']

  const url = new URL(BASE_URL)
  url.searchParams.set('query', query)
  url.searchParams.set('maxresults', String(maxresults))
  url.searchParams.set('key', getOrdnanceSurveyApiKey())
  url.searchParams.set('fq', localTypes.map((type) => `LOCAL_TYPE:${type}`).join(' '))

  const data = await safeFetchJson(url)
  const results = data?.results ?? []

  const filtered = results
    .map((item) => item?.GAZETTEER_ENTRY)
    .filter(Boolean)
    .filter((entry) => {
      if (isPostcodeQuery) return true
      return matchesNameOrPopulatedPlace(entry, query)
    })

  const mapped = filtered
    .map((entry) => {
      const label = buildLabel(entry)
      const coords = bngToWgs84(entry.GEOMETRY_X, entry.GEOMETRY_Y)
      if (!coords || !label) return null
      const payload = {
        name: label,
        lat: coords.lat,
        lng: coords.lng
      }
      return {
        description: label,
        place_id: encodeNamesPlaceId(payload),
        score: scoreEntry(entry, query)
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.description.localeCompare(b.description, 'en')
    })

  return dedupeByLabel(mapped)
    .slice(0, suggestionLimit)
    .map(({ description, place_id }) => ({ description, place_id }))
}

module.exports = {
  getNameSuggestions,
  decodeNamesPlaceId
}
