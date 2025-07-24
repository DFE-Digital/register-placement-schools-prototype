const Pagination = require('../helpers/pagination')
const {
  getSchoolTypeLabel,
  getSchoolGroupLabel,
  getSchoolStatusLabel,
  getSchoolEducationPhaseLabel,
  getAcademicYearLabel
} = require('../helpers/content')

const {
  PlacementSchool,
  School,
  Provider,
  AcademicYear,
  SchoolType,
  SchoolGroup,
  SchoolStatus,
  SchoolEducationPhase
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
  // do this check because if coming from overview page for example,
  // the query/param will be a string value, not an array containing a string
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
        type: s.schoolType ? s.schoolType.name : null,
        group: s.schoolGroup ? s.schoolGroup.name : null,
        status: s.schoolStatus ? s.schoolStatus.name : null,
        educationPhase: s.schoolEducationPhase ? s.schoolEducationPhase.name : null,
        academicYears: {}
      }
    }

    if (!grouped[s.id]) {
      grouped[s.id] = {
        id: s.id,
        name: s.name,
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
  const academicYear = null
  const showClosedSchool = null

  let schoolTypes
  if (filters?.schoolType) {
    schoolTypes = getCheckboxValues(schoolType, filters.schoolType)
  }

  let schoolGroups
  if (filters?.schoolGroup) {
    schoolGroups = getCheckboxValues(schoolGroup, filters.schoolGroup)
  }

  let schoolStatuses
  if (filters?.schoolStatuse) {
    schoolStatuses = getCheckboxValues(schoolStatus, filters.schoolStatus)
  }

  let schoolEducationPhases
  if (filters?.schoolEducationPhase) {
    schoolEducationPhases = getCheckboxValues(schoolEducationPhase, filters.schoolEducationPhase)
  }

  let academicYears
  if (filters?.academicYear) {
    academicYears = getCheckboxValues(academicYear, filters.academicYear)
  }

  let showClosedSchools
  if (filters?.showClosedSchool) {
    showClosedSchools = getCheckboxValues(showClosedSchool, filters.showClosedSchool)
  }

  const hasFilters = !!((schoolTypes?.length > 0)
   || (schoolGroups?.length > 0)
   || (schoolStatuses?.length > 0)
   || (schoolEducationPhases?.length > 0)
   || (academicYears?.length > 0)
   || (showClosedSchools?.length > 0)
  )

  let selectedFilters = null

  if (hasFilters) {
    selectedFilters = {
      categories: []
    }

    if (schoolTypes?.length) {
      selectedFilters.categories.push({
        heading: { text: 'School type' },
        items: schoolTypes.map((schoolType) => {
          return {
            text: getSchoolTypeLabel(schoolType),
            href: `/placement-schools/remove-school-type-filter/${schoolType}`
          }
        })
      })
    }

    if (schoolGroups?.length) {
      selectedFilters.categories.push({
        heading: { text: 'School group' },
        items: schoolGroups.map((schoolGroup) => {
          return {
            text: getSchoolGroupLabel(schoolGroup),
            href: `/placement-schools/remove-school-group-filter/${schoolGroup}`
          }
        })
      })
    }

    if (schoolStatuses?.length) {
      selectedFilters.categories.push({
        heading: { text: 'School status' },
        items: schoolStatuses.map((schoolStatus) => {
          return {
            text: getSchoolStatusLabel(schoolStatus),
            href: `/placement-schools/remove-school-status-filter/${schoolStatus}`
          }
        })
      })
    }

    if (schoolEducationPhases?.length) {
      selectedFilters.categories.push({
        heading: { text: 'School education phase' },
        items: schoolEducationPhases.map((schoolEducationPhase) => {
          return {
            text: getSchoolEducationPhaseLabel(schoolEducationPhase),
            href: `/placement-schools/remove-school-education-phase-filter/${schoolEducationPhase}`
          }
        })
      })
    }

    if (academicYears?.length) {
      selectedFilters.categories.push({
        heading: { text: 'Academic year' },
        items: academicYears.map((academicYear) => {
          return {
            text: getAcademicYearLabel(academicYear),
            href: `/placement-schools/remove-academic-year-filter/${academicYear}`
          }
        })
      })
    }

    if (showClosedSchools?.length) {
      selectedFilters.categories.push({
        heading: { text: 'Closed schools' },
        items: showClosedSchools.map((showClosedSchool) => {
          return {
            text: 'Include closed schools',
            href: `/placement-schools/remove-show-closed-school-filter/${showClosedSchool}`
          }
        })
      })
    }
  }

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

  let selectedClosedSchool = []
  if (filters?.showClosedSchool) {
    selectedClosedSchool = filters.showClosedSchool
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
  if (academicYears?.length) {
    wherePlacementSchool.academicYearId = { [Op.in]: academicYears }
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

  // Step 3: fetch full rows only for those IDs
  const rows = await PlacementSchool.findAll({
    where: {
      ...wherePlacementSchool,
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
          { model: SchoolEducationPhase, as: 'schoolEducationPhase' }
        ]
      },
      { model: Provider, as: 'provider' },
      { model: AcademicYear, as: 'academicYear' }
    ],
    order: [
      [{ model: School, as: 'school' }, 'name', 'ASC'],
      [{ model: AcademicYear, as: 'academicYear' }, 'name', 'ASC'],
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

exports.removeAcademicYearFilter = (req, res) => {
  const { filters } = req.session.data
  filters.academicYear = removeFilter(
    req.params.academicYear,
    filters.academicYear
  )
  res.redirect('/placement-schools')
}

exports.removeShowClosedSchoolFilter = (req, res) => {
  const { filters } = req.session.data
  filters.showClosedSchool = removeFilter(
    req.params.showClosedSchool,
    filters.showClosedSchool
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
