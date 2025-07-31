const { Op } = require('sequelize')

const {
  Provider,
  School
} = require('../models')

const {
  getPlaceDetails,
  getPlaceSuggestions
} = require('../services/googleMaps')

const {
  getPlacementSchoolDetails,
  getPlacementSchoolsByLocation,
  getPlacementSchoolsForProvider
} = require('../services/placementSchoolSearch')


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
