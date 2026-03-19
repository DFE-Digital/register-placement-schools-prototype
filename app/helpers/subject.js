/**
 * Metadata option and label helper functions for subjects lookup table.
 */

const { Subject } = require('../models')

/**
 * Retrieve ordered subject options for filters.
 * @returns {Promise<Array<{text: string, value: string, id: string}>>}
 */
const getSubjectOptions = async () => {
  const rows = await Subject.findAll({
    order: [['name', 'ASC']]
  })
  return rows.map(row => ({
    text: row.name,
    value: row.code,
    id: row.id
  }))
}

/**
 * Retrieve a subject label for a given code.
 * @param {string} code
 * @returns {Promise<string>}
 */
const getSubjectLabel = async (code) => {
  const row = await Subject.findOne({ where: { code } })
  return row?.name || `Unknown (${code})`
}

module.exports = {
  getSubjectOptions,
  getSubjectLabel
}
