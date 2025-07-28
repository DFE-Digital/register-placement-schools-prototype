const Pagination = require('../helpers/pagination')
const {
  getSchoolTypeOptions,
  getSchoolTypeLabel,
  getSchoolGroupOptions,
  getSchoolGroupLabel,
  getSchoolStatusOptions,
  getSchoolStatusLabel,
  getSchoolEducationPhaseOptions,
  getSchoolEducationPhaseLabel
} = require('../helpers/gias')

const {
  AcademicYear,
  PlacementSchool,
  Provider,
  School,
  SchoolAddress,
  SchoolDetail,
  SchoolEducationPhase,
  SchoolGroup,
  SchoolStatus,
  SchoolType,
  Sequelize
} = require('../models')

const { Op } = require('sequelize')

const getCheckboxValues = (name, data) => {
  return name && (Array.isArray(name)
    ? name
    : [name].filter((name) => {
        return name !== '_unchecked'
      })) || data && (Array.isArray(data) ? data : [data])
}

const removeFilter = (value, data) => {
  if (Array.isArray(data)) {
    return data.filter(item => item !== value)
  } else {
    return null
  }
}

const groupPlacementSchools = (rows) => {
  const grouped = {}

  rows.forEach(row => {

    const s = row.school
    const a = row.academicYear
    const p = row.provider

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
        academicYears: {}
      }
    }
    if (!grouped[s.id].academicYears[a.id]) {
      grouped[s.id].academicYears[a.id] = {
        id: a.id,
        name: a.name,
        providers: {}
      }
    }
    if (!grouped[s.id].academicYears[a.id].providers[p.id]) {
      grouped[s.id].academicYears[a.id].providers[p.id] = {
        id: p.id,
        name: p.operatingName
      }
    }
  })

  return Object.values(grouped).map(school => ({
    ...school,
    academicYears: Object.values(school.academicYears).map(year => ({
      ...year,
      providers: Object.values(year.providers)
    }))
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

  const hasFilters = !!((schoolTypes?.length > 0)
   || (schoolGroups?.length > 0)
   || (schoolStatuses?.length > 0)
   || (schoolEducationPhases?.length > 0)
  )

  let selectedFilters = null

  if (hasFilters) {
    selectedFilters = {
      categories: []
    }

    if (schoolGroups?.length) {
      const items = await Promise.all(
        schoolGroups.map(async (schoolGroup) => {
          const label = await getSchoolGroupLabel(schoolGroup)
          return {
            text: label,
            href: `/placement-schools/remove-school-group-filter/${schoolGroup}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'School group' },
        items: items
      })
    }

    if (schoolTypes?.length) {
      const items = await Promise.all(
        schoolTypes.map(async (schoolType) => {
          const label = await getSchoolTypeLabel(schoolType)
          return {
            text: label,
            href: `/placement-schools/remove-school-type-filter/${schoolType}`
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
            href: `/placement-schools/remove-school-education-phase-filter/${schoolEducationPhase}`
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
            href: `/placement-schools/remove-school-status-filter/${schoolStatus}`
          }
        })
      )

      selectedFilters.categories.push({
        heading: { text: 'School status' },
        items: items
      })
    }
  }

  const filterSchoolTypeItems = await getSchoolTypeOptions()
  const filterSchoolGroupItems = await getSchoolGroupOptions()
  const filterSchoolStatusItems = await getSchoolStatusOptions()
  const filterSchoolEducationPhaseItems = await getSchoolEducationPhaseOptions()

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

  const wherePlacementSchool = {}
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

  // Step 1: get distinct school IDs for page
  const distinctSchools = await PlacementSchool.findAll({
    attributes: ['schoolId'],
    include: [
      { model: School, as: 'school', attributes: [], where: whereSchool },
    ],
    where: wherePlacementSchool,
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
    include: [
      { model: School, as: 'school', attributes: [], where: whereSchool },
    ],
    where: wherePlacementSchool
  })

  // Step 3: get latest academic year for each school
  const latestAcademicYears = await PlacementSchool.findAll({
    attributes: [
      'schoolId',
      [Sequelize.fn('MAX', Sequelize.col('academic_year_id')), 'latestAcademicYearId']
    ],
    where: {
      schoolId: { [Op.in]: pageSchoolIds },
      ...wherePlacementSchool
    },
    group: ['schoolId'],
    raw: true
  })

  // Turn into a lookup (schoolId -> latest academicYearId)
  const schoolToLatestYear = {}
  latestAcademicYears.forEach(row => {
    schoolToLatestYear[row.schoolId] = row.latestAcademicYearId
  })

  // Step 4: fetch only latest academic year rows for those schools
  const rows = await PlacementSchool.findAll({
    where: {
      [Op.or]: Object.entries(schoolToLatestYear).map(([schoolId, academicYearId]) => ({
        schoolId,
        academicYearId
      }))
    },
    include: [
      {
        model: School,
        as: 'school',
        include: [
          { model: SchoolType, as: 'schoolType' },
          { model: SchoolGroup, as: 'schoolGroup' },
          { model: SchoolStatus, as: 'schoolStatus' },
          { model: SchoolEducationPhase, as: 'schoolEducationPhase' }
        ]
      },
      { model: Provider, as: 'provider' },
      { model: AcademicYear, as: 'academicYear' }
    ],
    order: [
      [{ model: School, as: 'school' }, 'name', 'ASC'],
      [{ model: Provider, as: 'provider' }, 'operatingName', 'ASC']
    ]
  })

  // Step 4: group as before
  const groupedPlacementSchools = groupPlacementSchools(rows)

  // Step 5: build pagination
  const pagination = new Pagination(groupedPlacementSchools, totalCount, page, limit)

  res.render('placement-schools/index', {
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
    selectedSchoolType,
    selectedSchoolGroup,
    selectedSchoolStatus,
    selectedSchoolEducationPhase,
    actions: {
      new: '/placement-schools/new/',
      view: '/placement-schools',
      filters: {
        apply: '/placement-schools',
        remove: '/placement-schools/remove-all-filters'
      },
      search: {
        find: '/placement-schools',
        remove: '/placement-schools/remove-keyword-search'
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
  res.redirect('/placement-schools')
}

exports.removeSchoolGroupFilter = (req, res) => {
  const { filters } = req.session.data
  filters.schoolGroup = removeFilter(
    req.params.schoolGroup,
    filters.schoolGroup
  )
  res.redirect('/placement-schools')
}

exports.removeSchoolStatusFilter = (req, res) => {
  const { filters } = req.session.data
  filters.schoolStatus = removeFilter(
    req.params.schoolStatus,
    filters.schoolStatus
  )
  res.redirect('/placement-schools')
}

exports.removeSchoolEducationPhaseFilter = (req, res) => {
  const { filters } = req.session.data
  filters.schoolEducationPhase = removeFilter(
    req.params.schoolEducationPhase,
    filters.schoolEducationPhase
  )
  res.redirect('/placement-schools')
}

exports.removeAllFilters = (req, res) => {
  delete req.session.data.filters
  res.redirect('/placement-schools')
}

exports.removeKeywordSearch = (req, res) => {
  delete req.session.data.keywords
  res.redirect('/placement-schools')
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
      { model: SchoolDetail, as: 'schoolDetail' },
      { model: SchoolAddress, as: 'schoolAddress' },
      { model: SchoolType, as: 'schoolType' },
      { model: SchoolGroup, as: 'schoolGroup' },
      { model: SchoolEducationPhase, as: 'schoolEducationPhase' },
      { model: SchoolStatus, as: 'schoolStatus' }
    ]
  })

  res.render('placement-schools/show', {
    placementSchool
   })
}

exports.placementSchoolPartnerships = async (req, res) => {
  // Clear session provider data
  delete req.session.data.keywords
  delete req.session.data.filters
  delete req.session.data.find

  const { schoolId } = req.params

  const placementSchool = await School.findOne({
    where: { id: schoolId }
  })

  const partnerships = await PlacementSchool.findAll({
    where: { schoolId },
    include: [
      { model: Provider, as: 'provider', attributes: ['id', 'operatingName'] },
      { model: AcademicYear, as: 'academicYear', attributes: ['id', 'name'] }
    ],
    order: [
      [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
      [{ model: Provider, as: 'provider' }, 'operatingName', 'ASC']
    ]
  })

  const groupedPartnerships = groupPartnershipsByAcademicYear(partnerships)


  res.render('placement-schools/partnerships/index', {
    placementSchool,
    groupedPartnerships
   })
}
