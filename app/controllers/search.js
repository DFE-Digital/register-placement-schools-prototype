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

const { getPlaceSuggestions, getPlaceDetails } = require('../services/googleMaps')
const { getPlacementSchoolsByLocation } = require('../services/placementSchoolSearch')


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

  // Step 1: Confirm provider exists
  const provider = await Provider.findByPk(providerId)
  if (!provider) return null

  // Step 2: Get total number of placements (used for pagination)
  const totalCount = await PlacementSchool.count({
    where: { providerId }
  })

  if (totalCount === 0) {
    return {
      provider: {
        id: provider.id,
        operatingName: provider.operatingName,
        legalName: provider.legalName,
        ukprn: provider.ukprn,
        urn: provider.urn
      },
      academicYears: [],
      pagination: new Pagination([], 0, page, limit)
    }
  }

  // Step 3: Get flattened list of placement rows (only schoolId + academicYear) for this page
  const pagedPlacementRows = await PlacementSchool.findAll({
    where: { providerId },
    include: [
      {
        model: AcademicYear,
        as: 'academicYear',
        attributes: ['id', 'name']
      },
      {
        model: School,
        as: 'school',
        attributes: ['id', 'name'],
        required: true
      }
    ],
    attributes: ['schoolId', 'academicYearId'],
    order: [
      [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
      [{ model: School, as: 'school' }, 'name', 'ASC']
    ],
    offset,
    limit,
    raw: true,
    nest: true
  })

  const schoolIds = pagedPlacementRows.map(row => row.schoolId)

  // Step 4: Fetch full school + academic year info for these schools
  const fullPlacements = await PlacementSchool.findAll({
    where: {
      providerId,
      schoolId: schoolIds
    },
    include: [
      {
        model: AcademicYear,
        as: 'academicYear',
        attributes: ['id', 'name']
      },
      {
        model: School,
        as: 'school',
        attributes: ['id', 'name', 'ukprn', 'urn'],
        include: [
          { model: SchoolAddress, as: 'schoolAddress' },
          { model: SchoolType, as: 'schoolType' },
          { model: SchoolGroup, as: 'schoolGroup' },
          { model: SchoolStatus, as: 'schoolStatus' },
          { model: SchoolEducationPhase, as: 'schoolEducationPhase' }
        ]
      }
    ]
  })

  // Step 5: Flatten for pagination and regroup by academic year
  const pageItems = fullPlacements.map(row => ({
    academicYearId: row.academicYear.id,
    academicYearName: row.academicYear.name,
    school: {
      id: row.school.id,
      name: row.school.name,
      ukprn: row.school.ukprn,
      urn: row.school.urn,
      type: row.school.schoolType?.name || null,
      group: row.school.schoolGroup?.name || null,
      status: row.school.schoolStatus?.name || null,
      educationPhase: row.school.schoolEducationPhase?.name || null,
      address: row.school.schoolAddress || null
    }
  }))

  // Sort again (in case DB order isn't preserved exactly)
  pageItems.sort((a, b) => {
    const yearCompare = b.academicYearName.localeCompare(a.academicYearName)
    return yearCompare !== 0 ? yearCompare : a.school.name.localeCompare(b.school.name)
  })

  const pagination = new Pagination(pageItems, totalCount, page, limit)

  // Step 6: Group paged items by academic year
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
    academicYears,
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
    const placeId = req.session.data?.location?.id

    if (!placeId) return res.redirect('/search/location')

    const place = await getPlaceDetails(placeId)
    if (!place || !place.geometry?.location) return res.redirect('/search/location')

    const searchLat = place.geometry.location.lat
    const searchLng = place.geometry.location.lng
    const radiusMiles = 10

    const { placements, pagination } = await getPlacementSchoolsByLocation(searchLat, searchLng, page, limit, radiusMiles)

    res.render('search/results-location', {
      location: {
        name: place.name,
        lat: searchLat,
        lng: searchLng
      },
      placements,
      pagination,
      radius: radiusMiles,
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

  if (!query || query.length < 2) {
    return res.json([])
  }

  try {
    const results = await getPlaceSuggestions(query)

    const suggestions = results.map((result) => ({
      text: result.description,
      value: result.place_id
    }))

    res.json(suggestions)
  } catch (err) {
    console.error(err)
    res.status(500).json([])
  }

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
