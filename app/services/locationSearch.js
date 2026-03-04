const {
  getPlaceDetails: getPlacesDetails,
  geocodeAddress
} = require('./ordnanceSurveyPlaces')

const {
  getNameSuggestions,
  decodeNamesPlaceId
} = require('./ordnanceSurveyNames')

/**
 * Returns place suggestions for the location autocomplete.
 * Currently uses OS Names API to prioritise settlement-level results.
 *
 * @param {string} input
 * @returns {Promise<Array<{description: string, place_id: string}>>}
 */
const getPlaceSuggestions = async (input) => {
  return getNameSuggestions(input)
}

/**
 * Resolves a place ID into a name + geometry object used by the search flow.
 * - If the ID is an encoded OS Names result, decode it and return coordinates.
 * - Otherwise, fall back to OS Places details lookup.
 *
 * @param {string} placeId
 * @returns {Promise<{name: string, geometry: { location: { lat: number, lng: number }}}|null>}
 */
const getPlaceDetails = async (placeId) => {
  const decoded = decodeNamesPlaceId(placeId)
  if (decoded) return decoded
  return getPlacesDetails(placeId)
}

module.exports = {
  geocodeAddress,
  getPlaceSuggestions,
  getPlaceDetails
}
