const passport = require('passport')
const { User } = require('../models')
const { isValidEmail } = require('../helpers/validation')

exports.signIn_get = (req, res) => {
  // If user is already authenticated, redirect to support page
  if (req.isAuthenticated()) {
    return res.redirect('/support/placement-schools')
  }

  // Check if we should use persona selection or sign-in form
  const useSignInForm = process.env.USE_SIGN_IN_FORM === 'true'

  if (useSignInForm) {
    // Redirect to email entry (step 1)
    res.redirect('/auth/sign-in/email')
  } else {
    // Redirect to persona selection
    res.redirect('/auth/persona')
  }
}

exports.signInEmail_get = (req, res) => {
  // If user is already authenticated, redirect to support page
  if (req.isAuthenticated()) {
    return res.redirect('/support/placement-schools')
  }

  res.render('authentication/sign-in-email', {
    email: req.session.email || '',
    actions: {
      save: '/auth/sign-in/email',
      cancel: '/'
    }
  })
}

exports.signInEmail_post = (req, res) => {
  const email = req.body.email
  const errors = []

  // Validate email - first check if empty
  if (!email || !email.trim().length) {
    const error = {}
    error.fieldName = 'email'
    error.href = '#email'
    error.text = 'Enter an email address'
    errors.push(error)
  } else if (!isValidEmail(email)) {
    // Second check if valid email format
    const error = {}
    error.fieldName = 'email'
    error.href = '#email'
    error.text = 'Enter a valid email address'
    errors.push(error)
  }

  // If validation fails, re-render the form with errors
  if (errors.length) {
    return res.render('authentication/sign-in-email', {
      email: email || '',
      errors,
      actions: {
        save: '/auth/sign-in/email',
        cancel: '/'
      }
    })
  }

  // Store email in session and redirect to password entry
  req.session.email = email.trim()
  res.redirect('/auth/sign-in/password')
}

exports.signInPassword_get = (req, res) => {
  // If user is already authenticated, redirect to support page
  if (req.isAuthenticated()) {
    return res.redirect('/support/placement-schools')
  }

  // If no email in session, redirect back to email entry
  if (!req.session.email) {
    return res.redirect('/auth/sign-in/email')
  }

  res.render('authentication/sign-in-password', {
    email: req.session.email,
    actions: {
      save: '/auth/sign-in/password',
      back: '/auth/sign-in/email'
    }
  })
}

exports.signInPassword_post = (req, res, next) => {
  const email = req.body.email || req.session.email
  const password = req.body.password
  const errors = []

  // Validate password
  if (!password || !password.trim().length) {
    const error = {}
    error.fieldName = 'password'
    error.href = '#password'
    error.text = 'Enter a password'
    errors.push(error)
  }

  // If validation fails, re-render the form with errors
  if (errors.length) {
    return res.render('authentication/sign-in-password', {
      email: email,
      errors,
      actions: {
        save: '/auth/sign-in/password',
        back: '/auth/sign-in/email'
      }
    })
  }

  // Authenticate with Passport
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err)
    }

    // Authentication failed
    if (!user) {
      const error = {}
      error.fieldName = 'password'
      error.href = '#password'
      error.text = info.message || 'Enter a valid email address and password'
      errors.push(error)

      return res.render('authentication/sign-in-password', {
        email: email,
        errors,
        actions: {
          save: '/auth/sign-in/password',
          back: '/auth/sign-in/email'
        }
      })
    }

    // Update last signed in timestamp before logging them in
    try {
      const lastSignedInAt = new Date()
      await user.update({
        lastSignedInAt,
        updatedById: user.id
      })
      user.lastSignedInAt = lastSignedInAt
    } catch (updateError) {
      return next(updateError)
    }

    // Log the user in
    req.logIn(user, (err) => {
      if (err) {
        return next(err)
      }

      // Clear email from session
      delete req.session.email

      // Redirect to intended page or default to support
      const redirectTo = req.session.returnTo || '/support/placement-schools'
      delete req.session.returnTo

      return res.redirect(redirectTo)
    })
  })(req, res, next)
}

exports.persona_get = (req, res) => {
  // If user is already authenticated, redirect to support page
  if (req.isAuthenticated()) {
    return res.redirect('/support/placement-schools')
  }

  res.render('authentication/persona', {
    actions: {
      save: '/auth/persona',
      cancel: '/'
    }
  })
}

exports.persona_post = async (req, res, next) => {
  const personaId = req.body.persona
  const errors = []

  // Validate that a persona has been selected
  if (!personaId) {
    const error = {}
    error.fieldName = 'persona'
    error.href = '#persona'
    error.text = 'Select who you want to sign in as'
    errors.push(error)
  }

  // If validation fails, re-render the form with errors
  if (errors.length) {
    return res.render('authentication/persona', {
      errors,
      actions: {
        save: '/auth/persona',
        cancel: '/'
      }
    })
  }

  try {
    // Find the user by ID
    const user = await User.findByPk(personaId)

    if (!user || !user.isActive) {
      const error = {}
      error.fieldName = 'persona'
      error.href = '#persona'
      error.text = 'Select a valid persona you want to sign in as'
      errors.push(error)

      return res.render('authentication/persona', {
        errors,
        actions: {
          save: '/auth/persona',
          cancel: '/'
        }
      })
    }

    // Update last signed in timestamp before logging them in
    try {
      const lastSignedInAt = new Date()
      await user.update({
        lastSignedInAt,
        updatedById: user.id
      })
      user.lastSignedInAt = lastSignedInAt
    } catch (updateError) {
      return next(updateError)
    }

    // Log the user in directly
    req.logIn(user, (err) => {
      if (err) {
        return next(err)
      }

      // Redirect to intended page or default to support
      const redirectTo = req.session.returnTo || '/support/placement-schools'
      delete req.session.returnTo

      return res.redirect(redirectTo)
    })
  } catch (error) {
    return next(error)
  }
}

exports.signOut_get = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err)
    }

    req.session.destroy((err) => {
      if (err) {
        return next(err)
      }

      res.redirect('/auth/sign-in')
    })
  })
}
