const BASE_URL = 'https://api.os.uk/search/places/v1'

/**
 * Returns the Ordnance Survey Places API key from environment variables.
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
 * @param {string | URL} url - The URL to fetch
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

/**
 * Converts a string to title case.
 *
 * @param {string} value
 * @returns {string}
 */
const toTitleCase = (value) => {
  if (!value || !value.trim()) return ''
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase())
}

/**
 * Formats a value for display, optionally uppercasing.
 *
 * @param {string} value
 * @param {{uppercase?: boolean}} [options]
 * @returns {string|null}
 */
const formatPart = (value, options = {}) => {
  if (!value || !value.trim()) return null
  const trimmed = value.trim()
  if (options.uppercase) return trimmed.toUpperCase()
  return toTitleCase(trimmed)
}

/**
 * Builds a single-line display name for a DPA address record.
 *
 * @param {object} dpa
 * @param {{includePostcode?: boolean}} [options]
 * @returns {string}
 */
const buildDisplayName = (dpa = {}, options = {}) => {
  const includePostcode = options.includePostcode ?? true
  const parts = [
    formatPart(dpa.ORGANISATION_NAME),
    formatPart(dpa.DEPARTMENT_NAME),
    formatPart(dpa.SUB_BUILDING_NAME),
    formatPart(dpa.BUILDING_NAME),
    formatPart(dpa.BUILDING_NUMBER),
    formatPart(dpa.DEPENDENT_THOROUGHFARE_NAME),
    formatPart(dpa.THOROUGHFARE_NAME),
    formatPart(dpa.DOUBLE_DEPENDENT_LOCALITY),
    formatPart(dpa.DEPENDENT_LOCALITY),
    formatPart(dpa.POST_TOWN)
  ].filter(Boolean)

  if (includePostcode) {
    const postcode = formatPart(dpa.POSTCODE, { uppercase: true })
    if (postcode) parts.push(postcode)
  }

  if (parts.length) return parts.join(', ')
  if (dpa.ADDRESS && dpa.ADDRESS.trim()) return dpa.ADDRESS.trim()
  return ''
}

/**
 * Converts input to a number or null.
 *
 * @param {string|number|null|undefined} value
 * @returns {number|null}
 */
const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

/**
 * Normalises a postcode (remove spaces, uppercase).
 *
 * @param {string} value
 * @returns {string}
 */
const normalisePostcode = (value) => {
  if (!value || !value.trim()) return ''
  return value.replace(/\s+/g, '').toUpperCase()
}

/**
 * Returns true when the input looks like a UK postcode.
 *
 * @param {string} value
 * @returns {boolean}
 */
const looksLikePostcode = (value) => {
  const compact = normalisePostcode(value)
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)
}

/**
 * Normalises user input for comparisons.
 *
 * @param {string} value
 * @returns {string}
 */
const normaliseQuery = (value) => {
  if (!value || !value.trim()) return ''
  return value.trim().toLowerCase()
}

/**
 * Returns true when a value starts with the query (case-insensitive).
 *
 * @param {string} value
 * @param {string} query
 * @returns {boolean}
 */
const startsWithQuery = (value, query) => {
  if (!value || !query) return false
  return value.trim().toLowerCase().startsWith(query)
}

/**
 * Ensures a suggestion ends with ", UK".
 *
 * @param {string} value
 * @returns {string}
 */
const appendCountrySuffix = (value) => {
  if (!value) return value
  if (value.toLowerCase().endsWith(', uk')) return value
  return `${value}, UK`
}

/**
 * Returns true when value equals query or starts with it (case-insensitive).
 *
 * @param {string} value
 * @param {string} query
 * @returns {boolean}
 */
const isSameOrStartsWithQuery = (value, query) => {
  if (!value || !query) return false
  const text = value.trim().toLowerCase()
  const q = query.trim().toLowerCase()
  return text === q || text.startsWith(q)
}

/**
 * Builds a short suggestion label for a DPA record based on the query.
 *
 * @param {object} dpa
 * @param {string} query
 * @param {{includePostcode?: boolean}} [options]
 * @returns {string}
 */
const buildSuggestionLabel = (dpa = {}, query = '', options = {}) => {
  const includePostcode = options.includePostcode ?? true
  const queryText = normaliseQuery(query)

  if (looksLikePostcode(query)) {
    const postcode = formatPart(dpa.POSTCODE, { uppercase: true })
    return postcode || buildDisplayName(dpa, { includePostcode })
  }

  if (isSameOrStartsWithQuery(dpa.POST_TOWN, queryText)) {
    return formatPart(dpa.POST_TOWN) || buildDisplayName(dpa, { includePostcode })
  }

  if (isSameOrStartsWithQuery(dpa.DEPENDENT_LOCALITY, queryText)) {
    const locality = formatPart(dpa.DEPENDENT_LOCALITY)
    const postTown = formatPart(dpa.POST_TOWN)
    if (locality && postTown) return `${locality}, ${postTown}`
    return locality || buildDisplayName(dpa, { includePostcode })
  }

  return buildDisplayName(dpa, { includePostcode })
}

/**
 * Scores a DPA record for ordering in suggestions.
 *
 * @param {object} dpa
 * @param {string} query
 * @returns {number}
 */
const scoreSuggestion = (dpa = {}, query = '') => {
  const hasTown = Boolean(dpa.POST_TOWN && dpa.POST_TOWN.trim())
  const hasPostcode = Boolean(dpa.POSTCODE && dpa.POSTCODE.trim())
  const hasLocality = Boolean(dpa.DEPENDENT_LOCALITY && dpa.DEPENDENT_LOCALITY.trim())

  const queryText = normaliseQuery(query)
  const queryIsPostcode = looksLikePostcode(query)

  let score = 0

  if (queryIsPostcode) {
    if (hasPostcode) score += 100
    const queryCompact = normalisePostcode(query)
    const postcodeCompact = normalisePostcode(dpa.POSTCODE || '')
    if (postcodeCompact && postcodeCompact.startsWith(queryCompact)) score += 20
  } else {
    if (hasTown) score += 120
    if (hasLocality) score += 80
  }

  if (isSameOrStartsWithQuery(dpa.POST_TOWN, queryText)) score += 200
  if (isSameOrStartsWithQuery(dpa.DEPENDENT_LOCALITY, queryText)) score += 160

  const matchScore = Number(dpa.MATCH)
  if (Number.isFinite(matchScore)) {
    score += Math.round(matchScore * 100)
  }

  return score
}

/**
 * De-duplicates items by a key function.
 *
 * @param {Array<object>} items
 * @param {(item: object) => string} keyFn
 * @returns {Array<object>}
 */
const dedupeByKey = (items, keyFn) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Normalises a label for comparisons (trim + lowercase).
 *
 * @param {string} value
 * @returns {string}
 */
const normaliseLabel = (value) => {
  if (!value) return ''
  return value.trim().toLowerCase()
}

/**
 * Returns true when the record matches town/locality fields.
 *
 * @param {object} dpa
 * @param {string} query
 * @returns {boolean}
 */
const matchesTownOrLocality = (dpa = {}, query = '') => {
  const queryText = normaliseQuery(query)
  if (!queryText) return false
  return (
    isSameOrStartsWithQuery(dpa.POST_TOWN, queryText) ||
    isSameOrStartsWithQuery(dpa.DEPENDENT_LOCALITY, queryText)
  )
}

/**
 * Returns true when the record matches a postcode query.
 *
 * @param {object} dpa
 * @param {string} query
 * @returns {boolean}
 */
const matchesPostcode = (dpa = {}, query = '') => {
  if (!looksLikePostcode(query)) return false
  const queryCompact = normalisePostcode(query)
  const postcodeCompact = normalisePostcode(dpa.POSTCODE || '')
  if (!postcodeCompact) return false
  return postcodeCompact.startsWith(queryCompact)
}

/**
 * Returns place autocomplete suggestions for a given input string.
 *
 * @param {string} input - The search input
 * @param {object} [options]
 * @param {number} [options.maxresults=10]
 * @param {number} [options.suggestionLimit=10]
 * @returns {Promise<Array<{description: string, place_id: string}>>}
 */
const getPlaceSuggestions = async (input, options = {}) => {
  if (!input || !input.trim()) return []

  const maxresults = options.maxresults ?? 100
  const suggestionLimit = options.suggestionLimit ?? 10
  const url = new URL(`${BASE_URL}/find`)
  url.searchParams.set('query', input)
  url.searchParams.set('maxresults', String(maxresults))
  url.searchParams.set('key', getOrdnanceSurveyApiKey())
  url.searchParams.set('output_srs', 'EPSG:4326')

  const data = await safeFetchJson(url)

  const results = data?.results ?? []

  const allDpa = results
    .map((item) => item?.DPA)
    .filter(Boolean)
  const includePostcode = looksLikePostcode(input)

  const scoped = allDpa.filter((dpa) => {
    if (includePostcode) return matchesPostcode(dpa, input)
    return matchesTownOrLocality(dpa, input)
  })

  const candidates = scoped.length ? scoped : allDpa

  const ranked = candidates
    .map((dpa) => {
      const description = buildSuggestionLabel(dpa, input, { includePostcode })
      const placeId = dpa.UPRN
      return {
        description: appendCountrySuffix(description),
        place_id: placeId,
        score: scoreSuggestion(dpa, input)
      }
    })
    .filter((result) => result.description && result.place_id)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.description.localeCompare(b.description, 'en')
    })

  return dedupeByKey(ranked, (item) => normaliseLabel(item.description))
    .map(({ description, place_id }) => ({ description, place_id }))
    .slice(0, suggestionLimit)
}

/**
 * Retrieves place details (geometry and name) for a given UPRN.
 *
 * @param {string} uprn - Ordnance Survey UPRN
 * @returns {Promise<object|null>} Place result or null if not found
 */
const getPlaceDetails = async (uprn) => {
  if (!uprn || !uprn.trim()) return null

  const url = new URL(`${BASE_URL}/uprn`)
  url.searchParams.set('uprn', uprn)
  url.searchParams.set('key', getOrdnanceSurveyApiKey())
  url.searchParams.set('output_srs', 'EPSG:4326')

  const data = await safeFetchJson(url)
  const dpa = data?.results?.[0]?.DPA
  if (!dpa) return null

  const lat = toNumberOrNull(dpa.LAT)
  const lng = toNumberOrNull(dpa.LNG)
  if (!(typeof lat === 'number' && typeof lng === 'number')) return null

  return {
    name: buildDisplayName(dpa),
    geometry: { location: { lat, lng } }
  }
}

/**
 * Geocodes a single-line address using OS Places and returns latitude/longitude.
 *
 * @param {string} addressString - The address to geocode.
 * @returns {Promise<{ latitude: number|null, longitude: number|null, uprn: string|null }>}
 */
const geocodeAddress = async (addressString) => {
  if (!addressString || !addressString.trim()) {
    throw new Error('Cannot geocode an empty or invalid address string.')
  }

  const [first] = await getPlaceSuggestions(addressString, { maxresults: 1 })
  if (!first) {
    throw new Error('Could not geocode this address.')
  }

  const details = await getPlaceDetails(first.place_id)
  return {
    latitude: details?.geometry?.location?.lat ?? null,
    longitude: details?.geometry?.location?.lng ?? null,
    uprn: first.place_id ?? null
  }
}

module.exports = {
  geocodeAddress,
  getPlaceSuggestions,
  getPlaceDetails
}
