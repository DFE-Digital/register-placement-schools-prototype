const BASE_URL = 'https://maps.googleapis.com/maps/api'

/**
 * Returns the Google Maps API key from environment variables.
 * Throws if not set.
 *
 * @returns {string}
 */
const getGoogleApiKey = () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key not set in environment variables.')
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
 * Takes a single-line address string, calls the Google Geocoding API,
 * and returns an object containing latitude, longitude, and Google place ID.
 *
 * @param {string} addressString - The address to geocode
 * @returns {Promise<{ latitude: number, longitude: number, googlePlaceId: string }>}
 * @throws {Error} If the input is invalid or the API fails
 */
const geocodeAddress = async (addressString) => {
  if (!addressString || !addressString.trim()) {
    throw new Error('Cannot geocode an empty or invalid address string.')
  }

  const url = new URL(`${BASE_URL}/geocode/json`)
  url.searchParams.set('address', addressString)
  url.searchParams.set('key', getGoogleApiKey())

  const geocodeResponse = await safeFetchJson(url)
  if (!geocodeResponse || geocodeResponse.status !== 'OK' || !geocodeResponse.results?.length) {
    const reason = geocodeResponse?.status || 'UNKNOWN_REASON'
    console.error(`Geocoding failed: status=${reason}`, geocodeResponse)
    throw new Error(`Could not geocode this address. Reason: ${reason}`)
  }

  const { lat, lng } = geocodeResponse.results[0].geometry.location
  const googlePlaceId = geocodeResponse.results[0].place_id

  return { latitude: lat, longitude: lng, googlePlaceId }
}

/**
 * Returns place autocomplete suggestions for a given input string.
 *
 * @param {string} input - The search input
 * @returns {Promise<Array<object>>} List of prediction objects (may be empty)
 */
const getPlaceSuggestions = async (input) => {
  const url = new URL(`${BASE_URL}/place/autocomplete/json`)
  url.searchParams.set('input', input)
  url.searchParams.set('key', getGoogleApiKey())
  url.searchParams.set('types', '(regions)')
  url.searchParams.set('components', 'country:gb')

  const data = await safeFetchJson(url)
  return data?.predictions || []
}

/**
 * Retrieves place details (geometry and name) for a given place ID.
 *
 * @param {string} placeId - Google place ID
 * @returns {Promise<object|null>} Place result or null if not found
 */
const getPlaceDetails = async (placeId) => {
  const url = new URL(`${BASE_URL}/place/details/json`)
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', getGoogleApiKey())
  url.searchParams.set('fields', 'geometry,name')

  const data = await safeFetchJson(url)
  return data?.result || null
}

module.exports = {
  geocodeAddress,
  getPlaceSuggestions,
  getPlaceDetails
}
