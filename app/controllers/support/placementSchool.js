const {
  AcademicYear,
  PlacementSchool,
  Provider,
  School,
  SchoolAddress,
  SchoolBoarder,
  SchoolDetail,
  SchoolEducationPhase,
  SchoolGroup,
  SchoolNurseryProvision,
  SchoolUrbanRuralLocation,
  Region,
  SchoolStatus,
  Subject,
  SchoolType,
  Sequelize
} = require('../../models')

const Pagination = require('../../helpers/pagination')

const {
  getSchoolTypeOptions,
  getSchoolTypeLabel,
  getSchoolGroupOptions,
  getSchoolGroupLabel,
  getSchoolStatusOptions,
  getSchoolStatusLabel,
  getSchoolEducationPhaseOptions,
  getSchoolEducationPhaseLabel,
  getRegionOptions,
  getRegionLabel
} = require('../../helpers/gias')

const {
  getCheckboxValues,
  removeFilter
} = require('../../helpers/search')
const {
  getAcademicYearOptions,
  getAcademicYearLabel,
  getCurrentAcademicYearCode
} = require('../../helpers/academicYear')
const {
  getSubjectOptions,
  getSubjectLabel
} = require('../../helpers/subject')
const {
  getProviderOptions,
  getProviderLabel
} = require('../../helpers/provider')

const { Op } = require('sequelize')

const groupPlacementSchools = (rows) => {
  const grouped = {}

  rows.forEach(row => {

    const s = row.school
    const a = row.academicYear
    const p = row.provider
    const subject = row.subject

    if (!grouped[s.id]) {
      grouped[s.id] = {
        id: s.id,
        name: s.name,
        ukprn: s.ukprn ? s.ukprn : null,
        urn: s.urn ? s.urn : null,
        type: s.schoolType ? s.schoolType.name : null,
        group: s.schoolGroup ? s.schoolGroup.name : null,
        status: s.schoolStatus ? s.schoolStatus.name : null,
        educationPhase: s.schoolEducationPhase ? s.schoolEducationPhase.name : null,
        statutoryLowAge: s.schoolDetail ? s.schoolDetail.statutoryLowAge : null,
        statutoryHighAge: s.schoolDetail ? s.schoolDetail.statutoryHighAge : null,
        region: s.schoolDetail?.region?.name || null,
        address: s.schoolAddress || {
          line1: '',
          line2: '',
          line3: '',
          town: '',
          county: '',
          postcode: ''
        },
        academicYears: {},
        placementAcademicYears: new Set(),
        placementSubjects: new Set(),
        placementProviders: new Set(),
        latestAcademicYearCode: null,
        latestAcademicYearId: null,
        latestAcademicYearName: null,
        latestAcademicYearProviders: {}
      }
    }

    if (a?.name) {
      grouped[s.id].placementAcademicYears.add(a.name)
    }

    if (subject?.name) {
      grouped[s.id].placementSubjects.add(subject.name)
    }

    if (p?.operatingName) {
      grouped[s.id].placementProviders.add(p.operatingName)
    }

    const academicYearCode = Number(a?.code)
    if (Number.isFinite(academicYearCode)) {
      const currentLatest = grouped[s.id].latestAcademicYearCode
      if (currentLatest === null || academicYearCode > currentLatest) {
        grouped[s.id].latestAcademicYearCode = academicYearCode
        grouped[s.id].latestAcademicYearId = a.id
        grouped[s.id].latestAcademicYearName = a.name
        grouped[s.id].latestAcademicYearProviders = {}
      }

      if (academicYearCode === grouped[s.id].latestAcademicYearCode) {
        if (p?.id) {
          grouped[s.id].latestAcademicYearProviders[p.id] = {
            id: p.id,
            name: p.operatingName
          }
        }
      }
    }
  })

  return Object.values(grouped).map(school => ({
    ...school,
    academicYears: school.latestAcademicYearName
      ? [{
          id: school.latestAcademicYearId,
          name: school.latestAcademicYearName,
          providers: Object.values(school.latestAcademicYearProviders)
        }]
      : [],
    placementAcademicYears: Array.from(school.placementAcademicYears),
    placementSubjects: Array.from(school.placementSubjects).sort((a, b) => a.localeCompare(b)),
    placementProviders: Array.from(school.placementProviders).sort((a, b) => a.localeCompare(b))
  }))
}

const groupPartnershipsByAcademicYear = (rows) => {
  const academicYears = {}

  rows.forEach(row => {
    const a = row.academicYear
    const p = row.provider

    if (!academicYears[a.id]) {
      academicYears[a.id] = {
        id: a.id,
        name: a.name,
        providers: {}
      }
    }

    if (!academicYears[a.id].providers[p.id]) {
      academicYears[a.id].providers[p.id] = {
        id: p.id,
        name: p.operatingName
      }
    }
  })

  return Object.values(academicYears).map(year => ({
    ...year,
    providers: Object.values(year.providers)
  }))
}

exports.placementSchoolsList = async (req, res) => {
  // clear session data
  delete req.session.data.placementSchool
  delete req.session.data.find

  const { filters } = req.session.data

  // variables for use in pagination
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 25
  const offset = (page - 1) * limit

  // search
  const keywords = req.session.data.keywords || ''
  const hasSearch = !!((keywords))

  // filters
  const schoolType = null
  const schoolGroup = null
  const schoolStatus = null
  const schoolEducationPhase = null
  const placementSubject = null
  const academicYear = null
  const provider = null
  const region = null

  let schoolTypes
  if (filters?.schoolType) {
    schoolTypes = getCheckboxValues(schoolType, filters.schoolType)
  }

  let schoolGroups
  if (filters?.schoolGroup) {
    schoolGroups = getCheckboxValues(schoolGroup, filters.schoolGroup)
  }

  let schoolStatuses
  if (filters?.schoolStatus) {
    schoolStatuses = getCheckboxValues(schoolStatus, filters.schoolStatus)
  }

  let schoolEducationPhases
  if (filters?.schoolEducationPhase) {
    schoolEducationPhases = getCheckboxValues(schoolEducationPhase, filters.schoolEducationPhase)
  }

  let placementSubjects
  if (filters?.placementSubject) {
    placementSubjects = getCheckboxValues(placementSubject, filters.placementSubject)
  }

  let academicYears
  if (filters?.academicYear) {
    academicYears = getCheckboxValues(academicYear, filters.academicYear)
  }

  let providers
  if (filters?.provider) {
    providers = getCheckboxValues(provider, filters.provider)
  }

  let regions
  if (filters?.region) {
    regions = getCheckboxValues(region, filters.region)
  }

  const hasFilters = !!((schoolTypes?.length > 0)
   || (schoolGroups?.length > 0)
   || (schoolStatuses?.length > 0)
   || (schoolEducationPhases?.length > 0)
   || (placementSubjects?.length > 0)
   || (academicYears?.length > 0)
   || (providers?.length > 0)
   || (regions?.length > 0)
  )

  let selectedFilters = null

  if (hasFilters) {
    selectedFilters = {
      categories: []
    }

    if (regions?.length) {
      const items = await Promise.all(
        regions.map(async (region) => {
          const label = await getRegionLabel(region)
          return {
            text: label,
            href: `/support/placement-schools/remove-region-filter/${region}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'Region' },
        items: items
      })
    }

    if (schoolGroups?.length) {
      const items = await Promise.all(
        schoolGroups.map(async (schoolGroup) => {
          const label = await getSchoolGroupLabel(schoolGroup)
          return {
            text: label,
            href: `/support/placement-schools/remove-school-group-filter/${schoolGroup}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'School type' }, // this should really be 'School group' but that's an internal term
        items: items
      })
    }

    if (schoolTypes?.length) {
      const items = await Promise.all(
        schoolTypes.map(async (schoolType) => {
          const label = await getSchoolTypeLabel(schoolType)
          return {
            text: label,
            href: `/support/placement-schools/remove-school-type-filter/${schoolType}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'School type' },
        items: items
      })
    }

    if (schoolEducationPhases?.length) {
      const items = await Promise.all(
        schoolEducationPhases.map(async (schoolEducationPhase) => {
          const label = await getSchoolEducationPhaseLabel(schoolEducationPhase)
          return {
            text: label,
            href: `/support/placement-schools/remove-school-education-phase-filter/${schoolEducationPhase}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'School education phase' },
        items: items
      })
    }

    if (schoolStatuses?.length) {
      const items = await Promise.all(
        schoolStatuses.map(async (schoolStatus) => {
          const label = await getSchoolStatusLabel(schoolStatus)
          return {
            text: label,
            href: `/support/placement-schools/remove-school-status-filter/${schoolStatus}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'School status' },
        items: items
      })
    }

    if (placementSubjects?.length) {
      const items = await Promise.all(
        placementSubjects.map(async (subjectCode) => {
          const label = await getSubjectLabel(subjectCode)
          return {
            text: label,
            href: `/support/placement-schools/remove-placement-subject-filter/${subjectCode}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'Subject' },
        items: items
      })
    }

    if (academicYears?.length) {
      const items = await Promise.all(
        academicYears.map(async (yearCode) => {
          const label = await getAcademicYearLabel(yearCode)
          return {
            text: label,
            href: `/support/placement-schools/remove-academic-year-filter/${yearCode}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'Academic year' },
        items: items
      })
    }

    if (providers?.length) {
      const items = await Promise.all(
        providers.map(async (providerId) => {
          const label = await getProviderLabel(providerId)
          return {
            text: label,
            href: `/support/placement-schools/remove-provider-filter/${providerId}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'Provider' },
        items: items
      })
    }
  }

  const filterSchoolTypeItems = await getSchoolTypeOptions()
  const filterSchoolGroupItems = await getSchoolGroupOptions()
  const filterSchoolStatusItems = await getSchoolStatusOptions()
  const filterSchoolEducationPhaseItems = await getSchoolEducationPhaseOptions()
  const filterAcademicYearItems = await getAcademicYearOptions({
    maxCode: getCurrentAcademicYearCode()
  })
  const filterPlacementSubjectItems = await getSubjectOptions()
  const filterProviderItems = await getProviderOptions()
  const filterRegionItems = await getRegionOptions()

  let selectedSchoolType = []
  if (filters?.schoolType) {
    selectedSchoolType = filters.schoolType
  }

  let selectedSchoolGroup = []
  if (filters?.schoolGroup) {
    selectedSchoolGroup = filters.schoolGroup
  }

  let selectedSchoolStatus = []
  if (filters?.schoolStatus) {
    selectedSchoolStatus = filters.schoolStatus
  }

  let selectedSchoolEducationPhase = []
  if (filters?.schoolEducationPhase) {
    selectedSchoolEducationPhase = filters.schoolEducationPhase
  }

  let selectedAcademicYear = []
  if (filters?.academicYear) {
    selectedAcademicYear = filters.academicYear
  }

  let selectedPlacementSubject = []
  if (filters?.placementSubject) {
    selectedPlacementSubject = filters.placementSubject
  }

  let selectedProvider = []
  if (filters?.provider) {
    selectedProvider = filters.provider
  }

  let selectedRegion = []
  if (filters?.region) {
    selectedRegion = filters.region
  }

  const selectedAcademicYearNames = (selectedAcademicYear || []).length
    ? filterAcademicYearItems
      .filter((item) => selectedAcademicYear.includes(item.value))
      .map((item) => item.text)
    : []

  const selectedPlacementSubjectNames = (selectedPlacementSubject || []).length
    ? filterPlacementSubjectItems
      .filter((item) => selectedPlacementSubject.includes(item.value))
      .map((item) => item.text)
    : []

  const selectedProviderNames = (selectedProvider || []).length
    ? filterProviderItems
      .filter((item) => selectedProvider.includes(item.value))
      .map((item) => item.text)
    : []

  const whereSchool = {}

  if (schoolTypes?.length) {
    whereSchool.typeCode = { [Op.in]: schoolTypes }
  }
  if (schoolGroups?.length) {
    whereSchool.groupCode = { [Op.in]: schoolGroups }
  }
  if (schoolStatuses?.length) {
    whereSchool.statusCode = { [Op.in]: schoolStatuses }
  }
  if (schoolEducationPhases?.length) {
    whereSchool.educationPhaseCode = { [Op.in]: schoolEducationPhases }
  }
  if (keywords && keywords.trim() !== '') {
    const term = `%${keywords.trim()}%`
    whereSchool[Op.or] = [
      { name: { [Op.like]: term } },
      { ukprn: { [Op.like]: term } },
      { urn: { [Op.like]: term } }
    ]
  }

  const schoolInclude = {
    model: School,
    as: 'school',
    attributes: [],
    where: whereSchool,
    required: true
  }

  if (regions?.length) {
    schoolInclude.include = [{
      model: SchoolDetail,
      as: 'schoolDetail',
      attributes: [],
      where: { regionCode: { [Op.in]: regions } },
      required: true
    }]
  }

  const includeForSchoolIds = [schoolInclude]

  if (academicYears?.length) {
    includeForSchoolIds.push({
      model: AcademicYear,
      as: 'academicYear',
      attributes: [],
      where: { code: { [Op.in]: academicYears } },
      required: true
    })
  }

  if (placementSubjects?.length) {
    includeForSchoolIds.push({
      model: Subject,
      as: 'subject',
      attributes: [],
      where: { code: { [Op.in]: placementSubjects } },
      required: true
    })
  }

  if (providers?.length) {
    includeForSchoolIds.push({
      model: Provider,
      as: 'provider',
      attributes: [],
      where: { id: { [Op.in]: providers } },
      required: true
    })
  }

  // Step 1: get distinct school IDs for page
  const distinctSchools = await PlacementSchool.findAll({
    attributes: ['schoolId'],
    include: includeForSchoolIds,
    group: ['schoolId'],
    order: [[{ model: School, as: 'school' }, 'name', 'ASC']],
    limit,
    offset,
    raw: true
  })

  // extract IDs
  const pageSchoolIds = distinctSchools.map(row => row.schoolId)

  // Step 2: count total distinct schools
  const totalCount = await PlacementSchool.count({
    distinct: true,
    col: 'school_id',
    include: includeForSchoolIds
  })

  // Step 3: fetch placement rows for those schools
  const rows = await PlacementSchool.findAll({
    where: {
      schoolId: { [Op.in]: pageSchoolIds }
    },
    include: [
      {
        model: School,
        as: 'school',
        include: [
          { model: SchoolType, as: 'schoolType' },
          { model: SchoolGroup, as: 'schoolGroup' },
          { model: SchoolStatus, as: 'schoolStatus' },
          { model: SchoolEducationPhase, as: 'schoolEducationPhase' },
          { model: SchoolDetail, as: 'schoolDetail', include: [{ model: Region, as: 'region' }] },
          { model: SchoolAddress, as: 'schoolAddress' }
        ]
      },
      { model: Provider, as: 'provider' },
      { model: AcademicYear, as: 'academicYear' },
      { model: Subject, as: 'subject' }
    ],
    order: [
      [{ model: School, as: 'school' }, 'name', 'ASC'],
      [{ model: AcademicYear, as: 'academicYear' }, 'code', 'DESC'],
      [{ model: Provider, as: 'provider' }, 'operatingName', 'ASC']
    ]
  })

  // Step 4: group as before
  const groupedPlacementSchools = groupPlacementSchools(rows)

  // Step 5: build pagination
  const pagination = new Pagination(groupedPlacementSchools, totalCount, page, limit)

  res.render('support/placement-schools/index', {
    // placement schools for *this* page
    placementSchools: pagination.getData(), // paged + grouped
    // the pagination metadata (pageItems, nextPage, etc.)
    pagination,
    // the selected filters
    selectedFilters,
    // the search terms
    keywords,
    //
    hasSearch,
    //
    hasFilters,
    filterSchoolTypeItems,
    filterSchoolGroupItems,
    filterSchoolStatusItems,
    filterSchoolEducationPhaseItems,
    filterAcademicYearItems,
    filterPlacementSubjectItems,
    filterProviderItems,
    filterRegionItems,
    selectedSchoolType,
    selectedSchoolGroup,
    selectedSchoolStatus,
    selectedSchoolEducationPhase,
    selectedAcademicYear,
    selectedPlacementSubject,
    selectedProvider,
    selectedRegion,
    selectedAcademicYearNames,
    selectedPlacementSubjectNames,
    selectedProviderNames,
    actions: {
      new: '/support/placement-schools/new/',
      view: '/support/placement-schools',
      filters: {
        apply: '/support/placement-schools',
        remove: '/support/placement-schools/remove-all-filters'
      },
      search: {
        find: '/support/placement-schools',
        remove: '/support/placement-schools/remove-keyword-search'
      }
    }
  })
}

exports.removeSchoolTypeFilter = (req, res) => {
  const { filters } = req.session.data
  filters.schoolType = removeFilter(
    req.params.schoolType,
    filters.schoolType
  )
  res.redirect('/support/placement-schools')
}

exports.removeSchoolGroupFilter = (req, res) => {
  const { filters } = req.session.data
  filters.schoolGroup = removeFilter(
    req.params.schoolGroup,
    filters.schoolGroup
  )
  res.redirect('/support/placement-schools')
}

exports.removeSchoolStatusFilter = (req, res) => {
  const { filters } = req.session.data
  filters.schoolStatus = removeFilter(
    req.params.schoolStatus,
    filters.schoolStatus
  )
  res.redirect('/support/placement-schools')
}

exports.removeSchoolEducationPhaseFilter = (req, res) => {
  const { filters } = req.session.data
  filters.schoolEducationPhase = removeFilter(
    req.params.schoolEducationPhase,
    filters.schoolEducationPhase
  )
  res.redirect('/support/placement-schools')
}

exports.removeAcademicYearFilter = (req, res) => {
  const { filters } = req.session.data
  filters.academicYear = removeFilter(
    req.params.academicYear,
    filters.academicYear
  )
  res.redirect('/support/placement-schools')
}

exports.removePlacementSubjectFilter = (req, res) => {
  const { filters } = req.session.data
  filters.placementSubject = removeFilter(
    req.params.placementSubject,
    filters.placementSubject
  )
  res.redirect('/support/placement-schools')
}

exports.removeProviderFilter = (req, res) => {
  const { filters } = req.session.data
  filters.provider = removeFilter(
    req.params.provider,
    filters.provider
  )
  res.redirect('/support/placement-schools')
}

exports.removeRegionFilter = (req, res) => {
  const { filters } = req.session.data
  filters.region = removeFilter(
    req.params.region,
    filters.region
  )
  res.redirect('/support/placement-schools')
}

exports.removeAllFilters = (req, res) => {
  delete req.session.data.filters
  res.redirect('/support/placement-schools')
}

exports.removeKeywordSearch = (req, res) => {
  delete req.session.data.keywords
  res.redirect('/support/placement-schools')
}

/// ------------------------------------------------------------------------ ///
/// Show placement school
/// ------------------------------------------------------------------------ ///

exports.placementSchoolDetails = async (req, res) => {
  delete req.session.data.keywords
  delete req.session.data.filters
  delete req.session.data.find

  const { schoolId } = req.params

  const placementSchool = await School.findOne({
    where: { id: schoolId },
    include: [
      { model: SchoolDetail, as: 'schoolDetail', include: [
        { model: SchoolBoarder, as: 'boarder' },
        { model: SchoolNurseryProvision, as: 'nurseryProvision' },
        { model: SchoolUrbanRuralLocation, as: 'urbanRuralLocation' }
      ] },
      { model: SchoolAddress, as: 'schoolAddress' },
      { model: SchoolType, as: 'schoolType' },
      { model: SchoolGroup, as: 'schoolGroup' },
      { model: SchoolEducationPhase, as: 'schoolEducationPhase' },
      { model: SchoolStatus, as: 'schoolStatus' }
    ]
  })

  res.render('support/placement-schools/show', {
    placementSchool,
    actions: {
      back: '/support/placement-schools'
    }
   })
}

exports.placementSchoolLocation = async (req, res) => {
  delete req.session.data.keywords
  delete req.session.data.filters
  delete req.session.data.find

  const { schoolId } = req.params
  const page = parseInt(req.query.page, 10) || 1
  const placementSchool = await School.findOne({
    where: { id: schoolId },
    include: [
      { model: SchoolDetail, as: 'schoolDetail', include: [{ model: Region, as: 'region' }] },
      { model: SchoolAddress, as: 'schoolAddress' },
      { model: SchoolStatus, as: 'schoolStatus' }
    ]
  })

  res.render('support/placement-schools/location', {
    placementSchool,
    osMapsApiKey: process.env.ORDNANCE_SURVEY_API_KEY,
    actions: {
      back: '/support/placement-schools'
    }
  })
}

exports.placementSchoolPlacements = async (req, res) => {
  // Clear session provider data
  delete req.session.data.keywords
  delete req.session.data.filters
  delete req.session.data.find

  const { schoolId } = req.params
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 25
  const offset = (page - 1) * limit
  const allowedSortKeys = ['academicYear', 'provider', 'subject']
  const defaultSortKey = 'academicYear'
  const defaultSortDirection = 'desc'
  const sortKey = allowedSortKeys.includes(req.query.sort) ? req.query.sort : defaultSortKey
  const sortDirection = (req.query.direction === 'asc' || req.query.direction === 'desc')
    ? req.query.direction
    : (sortKey === defaultSortKey ? defaultSortDirection : 'asc')
  const sortDirectionLabel = sortDirection === 'asc' ? '▲' : '▼' // 'ascending' : 'descending'
  const buildSortHref = (key) => {
    const nextDirection = (sortKey === key && sortDirection === 'asc') ? 'desc' : 'asc'
    const params = new URLSearchParams()
    params.set('sort', key)
    params.set('direction', nextDirection)
    if (req.query.limit) params.set('limit', limit)
    return `?${params.toString()}`
  }

  const sortLinks = {
    academicYear: buildSortHref('academicYear'),
    provider: buildSortHref('provider'),
    subject: buildSortHref('subject')
  }

  const placementSchool = await School.findOne({
    where: { id: schoolId },
    include: [
      { model: SchoolStatus, as: 'schoolStatus' }
    ]
  })

  const totalCount = await PlacementSchool.count({
    where: { schoolId }
  })

  let order = [
    [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
    [Sequelize.fn('LOWER', Sequelize.col('provider.operating_name')), 'ASC'],
    [{ model: Subject, as: 'subject' }, 'name', 'ASC']
  ]

  if (sortKey === 'academicYear') {
    order = [
      [{ model: AcademicYear, as: 'academicYear' }, 'name', sortDirection.toUpperCase()],
      [Sequelize.fn('LOWER', Sequelize.col('provider.operating_name')), 'ASC'],
      [{ model: Subject, as: 'subject' }, 'name', 'ASC']
    ]
  }

  if (sortKey === 'provider') {
    order = [
      [Sequelize.fn('LOWER', Sequelize.col('provider.operating_name')), sortDirection.toUpperCase()],
      [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
      [{ model: Subject, as: 'subject' }, 'name', 'ASC']
    ]
  }

  if (sortKey === 'subject') {
    order = [
      [{ model: Subject, as: 'subject' }, 'name', sortDirection.toUpperCase()],
      [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
      [Sequelize.fn('LOWER', Sequelize.col('provider.operating_name')), 'ASC']
    ]
  }

  const placements = await PlacementSchool.findAll({
    where: { schoolId },
    include: [
      { model: Provider, as: 'provider', attributes: ['id', 'operatingName'] },
      { model: AcademicYear, as: 'academicYear', attributes: ['id', 'name'] },
      { model: Subject, as: 'subject', attributes: ['id', 'name'] }
    ],
    order,
    limit,
    offset
  })

  const pagination = new Pagination(placements, totalCount, page, limit)
  const paginationSortParams = new URLSearchParams()
  if (sortKey) paginationSortParams.set('sort', sortKey)
  if (sortDirection) paginationSortParams.set('direction', sortDirection)
  if (limit) paginationSortParams.set('limit', limit)
  const sortQueryString = paginationSortParams.toString()
  if (sortQueryString) {
    const appendSortParams = (item) => {
      if (!item?.href) return
      const separator = item.href.includes('?') ? '&' : '?'
      item.href = `${item.href}${separator}${sortQueryString}`
    }
    if (pagination.previousPage) appendSortParams(pagination.previousPage)
    if (pagination.nextPage) appendSortParams(pagination.nextPage)
    pagination.pageItems?.forEach(appendSortParams)
  }

  res.render('support/placement-schools/placements', {
    placementSchool,
    placements: pagination.getData(),
    pagination,
    sortKey,
    sortDirection,
    sortDirectionLabel,
    sortLinks,
    actions: {
      back: '/support/placement-schools'
    }
   })
}
