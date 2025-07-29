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
  const errors = []

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

  res.render('search/location', {
    actions: {
      back: '/search',
      cancel: '/search',
      continue: '/search/location'
    }
  })
}

exports.searchLocation_post = async (req, res) => {
  const errors = []

  if (errors.length) {
    res.render('search/location', {
      actions: {
        back: '/search',
        cancel: '/search',
        continue: '/search/location'
      }
    })
  } else {
    res.redirect()
  }
}

exports.searchProvider_get = async (req, res) => {

  res.render('search/provider', {
    actions: {
      back: '/search',
      cancel: '/search',
      continue: '/search/provider'
    }
  })
}

exports.searchProvider_post = async (req, res) => {
  const errors = []

  if (errors.length) {
    res.render('search/provider', {
      actions: {
        back: '/search',
        cancel: '/search',
        continue: '/search/provider'
      }
    })
  } else {
    res.redirect()
  }
}
