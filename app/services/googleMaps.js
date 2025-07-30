const safeFetchJson = async (url) => {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Fetch failed: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data
  } catch (err) {
    console.error('Fetch threw an error:', err)
    return null
  }
}

/**
 * geocodeAddress
 *
 * Takes a single-line address string, calls the Google Geocoding API,
 * and returns an object containing { latitude, longitude, placeId }.
 *
 * Throws an Error if:
 * - The address is invalid.
 * - The API call fails or returns no results.
 *
 * @param {string} addressString - The address to geocode
 * @returns {Promise<{ latitude: number, longitude: number, placeId: string }>}
 */
const geocodeAddress = async (addressString) => {
  // Validate input
  if (!addressString || !addressString.trim()) {
    throw new Error("Cannot geocode an empty or invalid address string.")
  }

  // Build request URL
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error("Google Places API key not set in environment variables.")
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
              `address=${encodeURIComponent(addressString)}&key=${apiKey}`

  let geocodeResponse
  try {
    const response = await fetch(url)

    // Network-level errors (bad response codes, etc.)
    if (!response.ok) {
      throw new Error(`Failed to fetch geocoding data, HTTP status = ${response.status}`)
    }

    geocodeResponse = await response.json()
  } catch (err) {
    // Catch network or parsing errors
    console.error("Error fetching geocode data:", err)
    throw new Error("Error occurred while fetching geocode data.")
  }

  // Handle invalid data returned from Google
  if (geocodeResponse.status !== "OK" || !geocodeResponse.results || !geocodeResponse.results.length) {
    const reason = geocodeResponse.status || "UNKNOWN_REASON"
    console.error(`Geocoding failed: status=${reason}`, geocodeResponse)
    throw new Error(`Could not geocode this address. Reason: ${reason}`)
  }

  // Extract data from the first result
  const firstResult = geocodeResponse.results[0]
  const { lat, lng } = firstResult.geometry.location
  const googlePlaceId = firstResult.place_id

  return { latitude: lat, longitude: lng, googlePlaceId }
}

const getPlaceSuggestions = async (input) => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
  url.searchParams.set('input', input)
  url.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY)
  url.searchParams.set('types', '(regions)')
  url.searchParams.set('components', 'country:gb')

  const data = await safeFetchJson(url)

  return data?.predictions || []
}

const getPlaceDetails = async (placeId) => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY)
  url.searchParams.set('fields', 'geometry,name')

  const data = await safeFetchJson(url)

  return data?.result || null
}

module.exports = {
  geocodeAddress,
  getPlaceDetails,
  getPlaceSuggestions
}
