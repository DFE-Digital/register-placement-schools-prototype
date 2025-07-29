const { Op } = require('sequelize')

const {
  AcademicYear,
  PlacementSchool,
  Provider,
  School,
  SchoolAddress,
  SchoolAdmissionsPolicy,
  SchoolBoarder,
  SchoolDetail,
  SchoolEducationPhase,
  SchoolGender,
  SchoolGroup,
  SchoolNurseryProvision,
  SchoolReligiousCharacter,
  SchoolStatus,
  SchoolType
} = require('../models')

const Pagination = require('../helpers/pagination')

const getPlacementSchoolDetails = async (schoolId) => {
  const school = await School.findByPk(schoolId, {
    include: [
      // School address
      { model: SchoolAddress, as: 'schoolAddress' },

      // Look-up models for School
      { model: SchoolType, as: 'schoolType' },
      { model: SchoolGroup, as: 'schoolGroup' },
      { model: SchoolStatus, as: 'schoolStatus' },
      { model: SchoolEducationPhase, as: 'schoolEducationPhase' },

      // School detail with its look-ups
      {
        model: SchoolDetail,
        as: 'schoolDetail',
        include: [
          { model: SchoolAdmissionsPolicy, as: 'admissionsPolicy' },
          { model: SchoolBoarder, as: 'boarder' },
          { model: SchoolGender, as: 'gender' },
          { model: SchoolNurseryProvision, as: 'nurseryProvision' },
          { model: SchoolReligiousCharacter, as: 'religiousCharacter' }
        ]
      }
    ]
  })

  if (!school) return null

  // Get placement relationships
  const placementRelationships = await PlacementSchool.findAll({
    where: { schoolId: school.id },
    include: [
      { model: AcademicYear, as: 'academicYear' },
      { model: Provider, as: 'provider' }
    ],
    order: [
      [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
      [{ model: Provider, as: 'provider' }, 'operatingName', 'ASC']
    ]
  })

  // Group placements by academic year
  const groupedByYear = {}

  placementRelationships.forEach(row => {
    const year = row.academicYear
    const provider = row.provider

    if (!groupedByYear[year.id]) {
      groupedByYear[year.id] = {
        id: year.id,
        name: year.name,
        providers: []
      }
    }

    groupedByYear[year.id].providers.push({
      id: provider.id,
      name: provider.operatingName,
      ukprn: provider.ukprn,
      urn: provider.urn,
      type: provider.type
    })
  })

  const academicYears = Object.values(groupedByYear).sort((a, b) => b.name.localeCompare(a.name))

  return {
    id: school.id,
    name: school.name,
    ukprn: school.ukprn,
    urn: school.urn,
    type: school.schoolType?.name || null,
    group: school.schoolGroup?.name || null,
    status: school.schoolStatus?.name || null,
    educationPhase: school.schoolEducationPhase?.name || null,
    address: school.schoolAddress || null,
    detail: {
      ...school.schoolDetail?.toJSON(),
      admissionsPolicy: school.schoolDetail?.admissionsPolicy?.name || null,
      boarder: school.schoolDetail?.boarder?.name || null,
      gender: school.schoolDetail?.gender?.name || null,
      nurseryProvision: school.schoolDetail?.nurseryProvision?.name || null,
      religiousCharacter: school.schoolDetail?.religiousCharacter?.name || null
    },
    academicYears
  }
}

const getPlacementSchoolsForProvider = async (providerId, page = 1, limit = 25) => {
  const offset = (page - 1) * limit

  const provider = await Provider.findByPk(providerId)
  if (!provider) return null

  const placements = await PlacementSchool.findAll({
    where: { providerId },
    include: [
      {
        model: School,
        as: 'school',
        include: [
          { model: SchoolAddress, as: 'schoolAddress' },
          { model: SchoolType, as: 'schoolType' },
          { model: SchoolGroup, as: 'schoolGroup' },
          { model: SchoolStatus, as: 'schoolStatus' },
          { model: SchoolEducationPhase, as: 'schoolEducationPhase' }
        ]
      },
      { model: AcademicYear, as: 'academicYear' }
    ],
    order: [
      [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
      [{ model: School, as: 'school' }, 'name', 'ASC']
    ]
  })

  // Step 1: Flatten to school-level items
  const flattened = placements.map(row => {
    const s = row.school
    const year = row.academicYear

    return {
      academicYearId: year.id,
      academicYearName: year.name,
      school: {
        id: s.id,
        name: s.name,
        ukprn: s.ukprn,
        urn: s.urn,
        type: s.schoolType?.name || null,
        group: s.schoolGroup?.name || null,
        status: s.schoolStatus?.name || null,
        educationPhase: s.schoolEducationPhase?.name || null,
        address: s.schoolAddress || null
      }
    }
  })

  // Step 2: Sort flattened list by academic year name (DESC), then school name (ASC)
  flattened.sort((a, b) => {
    const yearCompare = b.academicYearName.localeCompare(a.academicYearName)
    if (yearCompare !== 0) return yearCompare
    return a.school.name.localeCompare(b.school.name)
  })

  // Step 3: Paginate at the school level
  const totalCount = flattened.length
  const pageItems = flattened.slice(offset, offset + limit)
  const pagination = new Pagination(pageItems, totalCount, page, limit)

  // Step 4: Regroup paginated items by academic year
  const grouped = {}
  for (const item of pageItems) {
    const yearId = item.academicYearId
    if (!grouped[yearId]) {
      grouped[yearId] = {
        id: yearId,
        name: item.academicYearName,
        schools: []
      }
    }
    grouped[yearId].schools.push(item.school)
  }

  const academicYears = Object.values(grouped).sort((a, b) =>
    b.name.localeCompare(a.name)
  )

  return {
    provider: {
      id: provider.id,
      operatingName: provider.operatingName,
      legalName: provider.legalName,
      ukprn: provider.ukprn,
      urn: provider.urn
    },
    academicYears, // Grouped by year, paginated by school count
    pagination
  }
}

exports.search_get = async (req, res) => {
  delete req.session.data.search
  delete req.session.data.q
  delete req.session.data.location
  delete req.session.data.provider
  delete req.session.data.school

  const q = req.session.data.q || req.query.q

  res.render('search/index', {
    q,
    actions: {
      continue: '/search'
    }
  })
}

exports.search_post = async (req, res) => {
  const q = req.session.data.q || req.query.q
  const errors = []

  if (q === undefined) {
    const error = {}
    error.fieldName = "q"
    error.href = "#q"
    error.text = "Select find placement schools by location or training provider"
    errors.push(error)
  }

  if (errors.length) {
    res.render('search/index', {
      q,
      errors,
      actions: {
        continue: '/search'
      }
    })
  } else {
    if (q === 'location') {
      res.redirect('/search/location')
    } else if (q === 'provider') {
      res.redirect('/search/provider')
    } else if (q === 'school') {
      res.redirect('/search/school')
    } else {
      res.send('Page not found')
    }
  }
}

exports.searchLocation_get = async (req, res) => {
  delete req.session.data.provider
  delete req.session.data.school

  const { search } = req.session.data

  res.render('search/location', {
    search,
    actions: {
      back: '/search',
      cancel: '/search',
      continue: '/search/location'
    }
  })
}

exports.searchLocation_post = async (req, res) => {
  const { search } = req.session.data
  const errors = []

  if (!search.length) {
    const error = {}
    error.fieldName = 'location'
    error.href = '#location'
    error.text = 'Enter city, town or postcode'
    errors.push(error)
  }

  if (errors.length) {
    res.render('search/location', {
      search,
      errors,
      actions: {
        back: '/search',
        cancel: '/search',
        continue: '/search/location'
      }
    })
  } else {
    res.redirect('/results')
  }
}

exports.searchSchool_get = async (req, res) => {
  delete req.session.data.location
  delete req.session.data.provider

  const { search } = req.session.data

  res.render('search/school', {
    search,
    actions: {
      back: '/search',
      cancel: '/search',
      continue: '/search/school'
    }
  })
}

exports.searchSchool_post = async (req, res) => {
  const { search } = req.session.data
  const errors = []

  if (!search.length) {
    const error = {}
    error.fieldName = 'school'
    error.href = '#school'
    error.text = 'Enter school name, UKPRN or URN'
    errors.push(error)
  }

  if (errors.length) {
    res.render('search/school', {
      search,
      errors,
      actions: {
        back: '/search',
        cancel: '/search',
        continue: '/search/school'
      }
    })
  } else {
    res.redirect('/results')
  }
}

exports.searchProvider_get = async (req, res) => {
  delete req.session.data.location
  delete req.session.data.school

  const { search } = req.session.data

  res.render('search/provider', {
    search,
    actions: {
      back: '/search',
      cancel: '/search',
      continue: '/search/provider'
    }
  })
}

exports.searchProvider_post = async (req, res) => {
  const { search } = req.session.data
  const errors = []

  if (!search.length) {
    const error = {}
    error.fieldName = 'provider'
    error.href = '#provider'
    error.text = 'Enter provider name, UKPRN or URN'
    errors.push(error)
  }

  if (errors.length) {
    res.render('search/provider', {
      search,
      errors,
      actions: {
        back: '/search',
        cancel: '/search',
        continue: '/search/provider'
      }
    })
  } else {
    res.redirect('/results')
  }
}

exports.results_get = async (req, res) => {
  const q = req.session.data.q || req.query.q
  const { search } = req.session.data

  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 25

  if (q === 'location') {
    res.render('search/results-location', {
      q,
      search,
      actions: {
        search: '/search'
      }
    })
  } else if (q === 'provider') {
    const { provider } = req.session.data
    const results = await getPlacementSchoolsForProvider(provider.id, page, limit)

    res.render('search/results-provider', {
      q,
      search,
      provider: results.provider,
      academicYears: results.academicYears,
      pagination: results.pagination,
      actions: {
        search: '/search'
      }
    })
  } else if (q === 'school') {
    const { school } = req.session.data
    const placementSchool = await getPlacementSchoolDetails(school.id)

    res.render('search/results-school', {
      q,
      search,
      placementSchool,
      actions: {
        search: '/search'
      }
    })
  } else {
    res.send('Page not found - Results')
  }

}

/// ------------------------------------------------------------------------ ///
/// Autocomplete data
/// ------------------------------------------------------------------------ ///

exports.locationSuggestions_json = async (req, res) => {
  req.headers['Access-Control-Allow-Origin'] = true

  const query = req.query.search || ''

  const locations = []

  res.json(locations)
}

exports.providerSuggestions_json = async (req, res) => {
  req.headers['Access-Control-Allow-Origin'] = true

  const query = req.query.search || ''

  const providers = await Provider.findAll({
    attributes: [
      'id',
      'operatingName',
      'legalName',
      'ukprn',
      'urn'
    ],
    where: {
      deletedAt: null,
      [Op.or]: [
        { operatingName: { [Op.like]: `%${query}%` } },
        { legalName: { [Op.like]: `%${query}%` } },
        { ukprn: { [Op.like]: `%${query}%` } },
        { urn: { [Op.like]: `%${query}%` } }
      ]
    },
    order: [['operatingName', 'ASC']]
  })

  res.json(providers)
}

exports.schoolSuggestions_json = async (req, res) => {
  req.headers['Access-Control-Allow-Origin'] = true

  const query = req.query.search || ''

  const schools = await School.findAll({
    attributes: [
      'id',
      'name',
      'ukprn',
      'urn'
    ],
    where: {
      deletedAt: null,
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { ukprn: { [Op.like]: `%${query}%` } },
        { urn: { [Op.like]: `%${query}%` } }
      ]
    },
    order: [['name', 'ASC']]
  })

  res.json(schools)
}
