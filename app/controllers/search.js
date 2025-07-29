exports.search_get = async (req, res) => {
  delete req.session.data.search
  delete req.session.data.q

  res.render('search/index', {
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
      errors,
      actions: {
        continue: '/search'
      }
    })
  } else {
    if (req.session.data.q === 'location') {
      res.redirect('/search/location')
    } else {
      res.redirect('/search/provider')
    }
  }
}

exports.searchLocation_get = async (req, res) => {
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

exports.searchProvider_get = async (req, res) => {
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
