/**
 * helpers/search.js
 *
 * Utilities for:
 * - Normalising checkbox/radio inputs
 * - Building "selected filters" UI data (compatible with GOV.UK selected filters pattern)
 * - Fetching option lists
 * - Parsing/storing filters per search mode (location/provider)
 */

const {
  getRegionOptions,
  getRegionLabel,
  getSchoolTypeOptions,
  getSchoolTypeLabel,
  getSchoolGroupOptions,
  getSchoolGroupLabel,
  getSchoolStatusOptions,
  getSchoolStatusLabel,
  getSchoolEducationPhaseOptions,
  getSchoolEducationPhaseLabel
} = require('./gias')
const {
  getAcademicYearOptions,
  getAcademicYearLabel,
  getCurrentAcademicYearCode
} = require('./academicYear')
const {
  getSubjectOptions,
  getSubjectLabel
} = require('./subject')

/**
 * @typedef {Object} OptionItem
 * @property {string} text - Human-readable label for an option.
 * @property {string} value - Code/value submitted by the form.
 * @property {string} [id] - Optional stable identifier (UUID).
 */

/**
 * @typedef {Object} SelectedFilterItem
 * @property {string} text - Human-readable label to display as a chip.
 * @property {string} href - URL that removes this specific selection.
 */

/**
 * @typedef {Object} SelectedFilterCategory
 * @property {{ text: string }} heading - Category heading (e.g. "School type").
 * @property {SelectedFilterItem[]} items - Items (“chips”) in this category.
 */

/**
 * @typedef {Object} SelectedFilters
 * @property {SelectedFilterCategory[]} categories
 */

/**
 * @callback LabelGetter
 * @param {string} code
 * @returns {Promise<string>} - Resolved label for a given code.
 */

/**
 * @callback RemoveHref
 * @param {string} code
 * @returns {string} - HREF that removes the code when followed.
 */

/**
 * @typedef {Object} SelectedFilterGroupConfig
 * @property {string} key
 * @property {string} heading
 * @property {string[]|undefined} [selected]
 * @property {LabelGetter} labelGetter
 * @property {RemoveHref} removeHref
 */

/**
 * @typedef {Object} ParsedFilters
 * @property {string|null} radius
 * @property {string[]} schoolType
 * @property {string[]} schoolGroup
 * @property {string[]} schoolStatus
 * @property {string[]} schoolEducationPhase
 * @property {string[]} academicYear
 * @property {string[]} placementSubject
 * @property {string[]} region
 */

/**
 * Normalise checkbox/radio POSTed values.
 *
 * Accepts either:
 *  - `name`: a direct value or array from the current request (preferred)
 *  - `data`: a fallback value or array (e.g. from session/query)
 *
 * Special case:
 *  - Filters out the sentinel value `_unchecked` (used by some forms to ensure a POST key exists).
 *
 * @param {string|string[]|undefined|null} name - Primary source value(s).
 * @param {string|string[]|undefined|null} data - Fallback value(s) if `name` is not provided.
 * @returns {string[]|undefined} - Normalised array of values, or `undefined` if neither provided.
 *
 * @example
 * // With a single checkbox value:
 * getCheckboxValues('A', undefined) // ['A']
 *
 * @example
 * // With an array from checkboxes:
 * getCheckboxValues(['A', 'B'], undefined) // ['A','B']
 *
 * @example
 * // Filters out sentinel:
 * getCheckboxValues('_unchecked', undefined) // []
 */
const getCheckboxValues = (name, data) => {
  return name && (Array.isArray(name)
    ? name
    : [name].filter((name) => {
        return name !== '_unchecked'
      })) || data && (Array.isArray(data) ? data : [data])
}

/**
 * Remove a single value from an array of selected filter values.
 *
 * @param {string} value - The value/code to remove.
 * @param {string[]|undefined|null} data - Existing selection(s).
 * @returns {string[]|null} - Array without the value, or `null` if input was not an array.
 */
const removeFilter = (value, data) => {
  if (Array.isArray(data)) {
    return data.filter(item => item !== value)
  } else {
    return null
  }
}

// Local static list of supported search radii (miles)
const radii = [
  {
    id: '9ac0ef3d-e54c-4838-8921-7fb0fcb19934',
    name: '10 miles',
    code: '10'
  },
  {
    id: '5aff0aa3-701d-481d-931a-dd1040c0fbb5',
    name: '25 miles',
    code: '25'
  },
  {
    id: '45065bec-1e77-47f8-a246-17cb06d31ac9',
    name: '50 miles',
    code: '50'
  }
]

/**
 * Get option items for the Radius filter (static).
 * @returns {Promise<OptionItem[]>}
 */
const getRadiusOptions = async () => {
  return radii.map(row => ({
    text: row.name,
    value: row.code,
    id: row.id
  }))
}

/**
 * Resolve a human-readable label for a radius code.
 * @param {string} code - e.g. '25'
 * @returns {Promise<string>} - e.g. '25 miles' or 'Unknown (25)'
 */
const getRadiusLabel = async (code) => {
  const row = radii.find(r => r.code === code)
  return row?.name || `Unknown (${code})`
}

/**
 * Parse a positive integer with a fallback.
 *
 * @param {unknown} v - Value to parse (string/number).
 * @param {number} fallback - Fallback if `v` is not a positive finite integer.
 * @returns {number} - Parsed positive integer or the fallback.
 *
 * @example
 * asInt('25', 10) // 25
 * asInt('0', 10)  // 10 (fallback because <= 0)
 * asInt('xx', 10) // 10 (fallback because NaN)
 */
const asInt = (v, fallback) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// --- selected filters (UI) builder ------------------------------------------

/**
 * Build the "selected filters" data for the UI from an array of group configs.
 *
 * The returned structure matches what the GOV.UK selected filters macro expects:
 * { categories: [{ heading: { text }, items: [{ text, href }] }] }
 *
 * @param {SelectedFilterGroupConfig[]} groups
 * @returns {Promise<SelectedFilters|null>} - Null if nothing selected.
 *
 * @example
 * const sel = { schoolType: ['PRI','SEC'] }
 * const sf = await buildSelectedFilters([
 *   {
 *     key: 'schoolType',
 *     heading: 'School type',
 *     selected: sel.schoolType,
 *     labelGetter: getSchoolTypeLabel,
 *     removeHref: (code) => `/results/remove-school-type-filter/${code}`
 *   }
 * ])
 * // -> { categories: [ { heading: { text: 'School type' }, items: [...] } ] }
 */
const buildSelectedFilters = async (groups) => {
  const categories = []

  for (const g of groups) {
    if (!g.selected?.length) continue
    const items = await Promise.all(
      g.selected.map(async (code) => ({
        text: await g.labelGetter(code),
        href: g.removeHref(code)
      }))
    )
    categories.push({ heading: { text: g.heading }, items })
  }

  return categories.length ? { categories } : null
}

// --- filter parsing ----------------------------------------------------------

/**
 * Parse/normalise raw filter data (e.g. from `req.session.data.filters` or `req.query.filters`)
 * into consistent arrays for downstream queries. Keeps `radius` as a single string or null.
 *
 * @param {Record<string, any>} [filters={}] - Raw filters object.
 * @returns {ParsedFilters}
 */
const parseFilters = (filters = {}) => ({
  // location mode
  radius: filters.radius ?? null,
  schoolType: Array.isArray(filters.schoolType) ? filters.schoolType : (filters.schoolType ? [filters.schoolType] : []),
  schoolGroup: Array.isArray(filters.schoolGroup) ? filters.schoolGroup : (filters.schoolGroup ? [filters.schoolGroup] : []),
  schoolStatus: Array.isArray(filters.schoolStatus) ? filters.schoolStatus : (filters.schoolStatus ? [filters.schoolStatus] : []),
  schoolEducationPhase: Array.isArray(filters.schoolEducationPhase) ? filters.schoolEducationPhase : (filters.schoolEducationPhase ? [filters.schoolEducationPhase] : []),
  academicYear: Array.isArray(filters.academicYear) ? filters.academicYear : (filters.academicYear ? [filters.academicYear] : []),
  placementSubject: Array.isArray(filters.placementSubject) ? filters.placementSubject : (filters.placementSubject ? [filters.placementSubject] : []),

  // provider mode
  region: Array.isArray(filters.region) ? filters.region : (filters.region ? [filters.region] : [])
})

/**
 * Check if any of the provided filter keys contain a value.
 *
 * @param {ParsedFilters} f - Parsed filters.
 * @param {Array<keyof ParsedFilters>} keys - Keys to test.
 * @returns {boolean}
 *
 * @example
 * hasAnyFilters(sel, ['schoolType','schoolGroup']) // true/false
 */
const hasAnyFilters = (f, keys) =>
  keys.some((k) => Array.isArray(f[k]) ? f[k].length > 0 : Boolean(f[k]))

// --- option lists fetcher ----------------------------------------------------

/**
 * Fetch option lists for a given search mode.
 *
 * - Shared lists are always loaded (type, group, status, education phase).
 * - Location mode additionally includes radius options.
 * - Provider mode additionally includes region options.
 *
 * @param {'location'|'provider'} mode
 * @returns {Promise<Record<string, OptionItem[]>>}
 *
 * @example
 * const options = await fetchFilterOptions('location')
 * // -> { filterRadiusItems, filterSchoolTypeItems, ... }
 */
const fetchFilterOptions = async (mode) => {
  // shared
  const [
    filterSchoolTypeItems,
    filterSchoolGroupItems,
    filterSchoolStatusItems,
    filterSchoolEducationPhaseItems,
    filterAcademicYearItems,
    filterPlacementSubjectItems
  ] = await Promise.all([
    getSchoolTypeOptions(),
    getSchoolGroupOptions(),
    getSchoolStatusOptions(),
    getSchoolEducationPhaseOptions(),
    getAcademicYearOptions({ maxCode: getCurrentAcademicYearCode() }),
    getSubjectOptions()
  ])

  if (mode === 'location') {
    const filterRadiusItems = await getRadiusOptions()
    return {
      filterRadiusItems,
      filterSchoolTypeItems,
      filterSchoolGroupItems,
      filterSchoolStatusItems,
      filterSchoolEducationPhaseItems,
      filterAcademicYearItems,
      filterPlacementSubjectItems
    }
  }

  if (mode === 'provider') {
    const filterRegionItems = await getRegionOptions()
    return {
      filterRegionItems,
      filterSchoolTypeItems,
      filterSchoolGroupItems,
      filterSchoolStatusItems,
      filterSchoolEducationPhaseItems,
      filterAcademicYearItems,
      filterPlacementSubjectItems
    }
  }

  return {}
}

// --- per-mode configs for selected-filters UI --------------------------------

/**
 * Selected-filters config for "location" search mode.
 * Pass the parsed selections to get group configs suitable for buildSelectedFilters().
 *
 * @param {ParsedFilters} sel
 * @returns {SelectedFilterGroupConfig[]}
 */
const locationSelectedFilterConfig = (sel) => ([
  // If you re-enable radius chips, uncomment this block
  // {
  //   key: 'radius',
  //   heading: 'Search radius',
  //   selected: sel.radius ? [sel.radius] : [],
  //   labelGetter: getRadiusLabel,
  //   removeHref: (code) => `/results/remove-radius-filter/${code}`
  // },
  {
    key: 'schoolGroup',
    heading: 'School group',
    selected: sel.schoolGroup,
    labelGetter: getSchoolGroupLabel,
    removeHref: (code) => `/results/remove-school-group-filter/${code}`
  },
  {
    key: 'schoolType',
    heading: 'School type',
    selected: sel.schoolType,
    labelGetter: getSchoolTypeLabel,
    removeHref: (code) => `/results/remove-school-type-filter/${code}`
  },
  {
    key: 'schoolEducationPhase',
    heading: 'Education phase',
    selected: sel.schoolEducationPhase,
    labelGetter: getSchoolEducationPhaseLabel,
    removeHref: (code) => `/results/remove-school-education-phase-filter/${code}`
  },
  {
    key: 'schoolStatus',
    heading: 'School status',
    selected: sel.schoolStatus,
    labelGetter: getSchoolStatusLabel,
    removeHref: (code) => `/results/remove-school-status-filter/${code}`
  },
  {
    key: 'placementSubject',
    heading: 'Placement subject',
    selected: sel.placementSubject,
    labelGetter: getSubjectLabel,
    removeHref: (code) => `/results/remove-placement-subject-filter/${code}`
  },
  {
    key: 'academicYear',
    heading: 'Academic year',
    selected: sel.academicYear,
    labelGetter: getAcademicYearLabel,
    removeHref: (code) => `/results/remove-academic-year-filter/${code}`
  }
])

/**
 * Selected-filters config for "provider" search mode.
 *
 * @param {ParsedFilters} sel
 * @returns {SelectedFilterGroupConfig[]}
 */
const providerSelectedFilterConfig = (sel) => ([
  {
    key: 'region',
    heading: 'Region',
    selected: sel.region,
    labelGetter: getRegionLabel,
    removeHref: (code) => `/results/remove-region-filter/${code}`
  },
  {
    key: 'schoolGroup',
    heading: 'School group',
    selected: sel.schoolGroup,
    labelGetter: getSchoolGroupLabel,
    removeHref: (code) => `/results/remove-school-group-filter/${code}`
  },
  {
    key: 'schoolType',
    heading: 'School type',
    selected: sel.schoolType,
    labelGetter: getSchoolTypeLabel,
    removeHref: (code) => `/results/remove-school-type-filter/${code}`
  },
  {
    key: 'schoolEducationPhase',
    heading: 'Education phase',
    selected: sel.schoolEducationPhase,
    labelGetter: getSchoolEducationPhaseLabel,
    removeHref: (code) => `/results/remove-school-education-phase-filter/${code}`
  },
  {
    key: 'schoolStatus',
    heading: 'School status',
    selected: sel.schoolStatus,
    labelGetter: getSchoolStatusLabel,
    removeHref: (code) => `/results/remove-school-status-filter/${code}`
  },
  {
    key: 'placementSubject',
    heading: 'Placement subject',
    selected: sel.placementSubject,
    labelGetter: getSubjectLabel,
    removeHref: (code) => `/results/remove-placement-subject-filter/${code}`
  },
  {
    key: 'academicYear',
    heading: 'Academic year',
    selected: sel.academicYear,
    labelGetter: getAcademicYearLabel,
    removeHref: (code) => `/results/remove-academic-year-filter/${code}`
  }
])

/**
 * Escape a value for CSV output (RFC 4180 style).
 * - Doubles internal quotes and wraps the field in quotes if it contains a quote, comma, CR, or LF.
 * - Null/undefined become an empty string.
 *
 * @param {unknown} value - Any value to serialise into a CSV cell.
 * @returns {string} A CSV-safe string representation.
 * @example
 * csvEscape('ACME "Ltd", London'); // => "\"ACME \"\"Ltd\"\", London\""
 * csvEscape(42); // => "42"
 */
const csvEscape = (value) => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return (/[",\r\n]/.test(str)) ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * Format an age range from statutory low/high ages.
 * - If both provided: "low–high" (en dash).
 * - If only low provided: "low+".
 * - If only high provided: "≤high".
 * - If neither provided or not finite: "".
 *
 * @param {number | null | undefined} low - The statutory low age.
 * @param {number | null | undefined} high - The statutory high age.
 * @returns {string} The formatted age range string.
 * @example
 * formatAgeRange(5, 11); // => "5–11"
 * formatAgeRange(11, null); // => "11+"
 * formatAgeRange(undefined, 16); // => "≤16"
 * formatAgeRange(undefined, undefined); // => ""
 */
const formatAgeRange = (low, high) => {
  const l = Number.isFinite(low) ? low : null
  const h = Number.isFinite(high) ? high : null
  if (l !== null && h !== null) return `${l}–${h}`
  if (l !== null) return `${l}+`
  if (h !== null) return `≤${h}`
  return ''
}

/**
 * Convert kilometres to miles and format to a fixed number of decimal places.
 * Returns an empty string for non-numeric input.
 *
 * @param {number} km - Distance in kilometres.
 * @param {number} [dp=2] - Decimal places to format to.
 * @returns {string} Miles, formatted to the specified decimal places, or "" if input is invalid.
 * @example
 * kmToMiles(10); // => "6.21"
 * kmToMiles(0, 3); // => "0.000"
 * kmToMiles(NaN); // => ""
 */
const kmToMiles = (km, dp = 2) => {
  if (typeof km !== 'number' || Number.isNaN(km)) return ''
  const miles = km * 0.621371
  return miles.toFixed(dp)
}

/**
 * Normalise a list of academic years (from varied shapes) into a comma-separated string.
 * Accepts:
 * - An array of strings (e.g. ["2024 to 2025", "2025 to 2026"])
 * - An array of objects with { name? | label? | code? }
 * - An object with a `rows` array in either of the above shapes
 * Returns "" if nothing usable is found.
 *
 * @param {Array<string | {name?: string, label?: string, code?: string}> | {rows?: Array<string | {name?: string, label?: string, code?: string}>} | null | undefined} value
 * @returns {string} Comma-separated academic year labels.
 * @example
 * normaliseAcademicYears(['2024 to 2025', '2025 to 2026']); // => "2024 to 2025, 2025 to 2026"
 * normaliseAcademicYears([{ name: '2024 to 2025' }, { code: 'AY2025' }]); // => "2024 to 2025, AY2025"
 * normaliseAcademicYears({ rows: [{ label: '2026 to 2027' }] }); // => "2026 to 2027"
 * normaliseAcademicYears(null); // => ""
 */
const normaliseAcademicYears = (value) => {
  // Accept: ['2024 to 2025', ...] or [{ name:'2024 to 2025' }, { code:'AY2024' }] etc.
  if (!value) return ''
  const arr = Array.isArray(value) ? value : (Array.isArray(value?.rows) ? value.rows : [])
  if (!Array.isArray(arr)) return ''
  const labels = arr.map(x => {
    if (typeof x === 'string') return x
    if (x?.name) return x.name
    if (x?.label) return x.label
    if (x?.code) return x.code
    return ''
  }).filter(Boolean)
  return labels.join(', ')
}

module.exports = {
  getCheckboxValues,
  removeFilter,
  getRadiusOptions,
  getRadiusLabel,
  asInt,
  buildSelectedFilters,
  parseFilters,
  hasAnyFilters,
  fetchFilterOptions,
  locationSelectedFilterConfig,
  providerSelectedFilterConfig,
  csvEscape,
  formatAgeRange,
  kmToMiles,
  normaliseAcademicYears
}
