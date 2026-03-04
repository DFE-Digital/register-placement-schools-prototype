/**
 * Metadata option and label helper functions for academic year lookup table.
 *
 * These functions retrieve metadata records from the database and return
 * structured arrays suitable for populating GOV.UK checkbox and select
 * components. Each category also includes a label function to convert a
 * code into a human-readable name.
 *
 * All records are sorted by `code` (varchar) and then `name` (varchar).
 */

const { AcademicYear } = require('../models')

const getCurrentAcademicYearCode = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value
    return acc
  }, {})

  const year = Number(parts.year)
  const month = Number(parts.month)

  if (!Number.isFinite(year) || !Number.isFinite(month)) return NaN
  return month >= 8 ? year : year - 1
}

/**
 * Generic function to retrieve ordered lookup options
 */
const getOptions = async (model, where = {}) => {
  const rows = await model.findAll({
    where,
    order: [['code', 'ASC'], ['name', 'ASC']]
  })
  return rows.map(row => ({
    text: row.name,
    value: row.code,
    id: row.id
  }))
}

/**
 * Generic function to retrieve label for a given code
 */
const getLabel = async (model, code) => {
  const row = await model.findOne({ where: { code } })
  return row?.name || `Unknown (${code})`
}

module.exports = {
  getCurrentAcademicYearCode,
  getAcademicYearOptions: async ({ maxCode } = {}) => {
    let options = await getOptions(AcademicYear)
    if (Number.isFinite(maxCode)) {
      options = options.filter(option => Number(option.value) <= maxCode)
    }
    return options.sort((a, b) => Number(b.value) - Number(a.value))
  },
  getAcademicYearLabel: (code) => getLabel(AcademicYear, code),
}
