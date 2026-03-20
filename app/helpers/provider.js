/**
 * Metadata option and label helper functions for providers lookup.
 */

const { Provider } = require('../models')

/**
 * Retrieve ordered provider options for filters.
 * @returns {Promise<Array<{text: string, value: string, id: string}>>}
 */
const getProviderOptions = async () => {
  const rows = await Provider.findAll({
    order: [['operatingName', 'ASC']]
  })
  return rows.map(row => ({
    text: row.operatingName,
    value: row.id,
    id: row.id
  }))
}

/**
 * Retrieve a provider label for a given id.
 * @param {string} id
 * @returns {Promise<string>}
 */
const getProviderLabel = async (id) => {
  const row = await Provider.findByPk(id)
  return row?.operatingName || `Unknown (${id})`
}

module.exports = {
  getProviderOptions,
  getProviderLabel
}
