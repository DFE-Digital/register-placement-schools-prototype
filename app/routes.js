//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

require('dotenv').config()

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const session = require('express-session')

/// ------------------------------------------------------------------------ ///
/// Session configuration
/// ------------------------------------------------------------------------ ///
router.use(
  session({
    secret: process.env.SESSION_SECRET || 'default-insecure-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  })
)

/// ------------------------------------------------------------------------ ///
/// Flash messaging
/// ------------------------------------------------------------------------ ///
const flash = require('connect-flash')
router.use(flash())

/// ------------------------------------------------------------------------ ///
/// Passport authentication
/// ------------------------------------------------------------------------ ///
const passport = require('./config/passport')

router.use(passport.initialize())
router.use(passport.session())

/// ------------------------------------------------------------------------ ///
/// Controller modules
/// ------------------------------------------------------------------------ ///
const authenticationController = require('./controllers/authentication')
const contentController = require('./controllers/content')
const errorController = require('./controllers/error')
const feedbackController = require('./controllers/feedback')
const searchController = require('./controllers/search')
const supportAccountController = require('./controllers/support/account')
const supportPlacementSchoolController = require('./controllers/support/placementSchool')
const supportUserController = require('./controllers/support/user')

/// ------------------------------------------------------------------------ ///
/// Authentication middleware
/// ------------------------------------------------------------------------ ///
const checkIsAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (!req.user.isActive) {
      return res.redirect('/account-not-authorised')
    }

    // Set base URLs for navigation
    res.locals.baseUrl = `/placement-schools/${req.params.schoolId}`
    res.locals.supportBaseUrl = `/support/placement-schools/${req.params.schoolId}`
    // Make user available in templates
    res.locals.passport = {
      user: {
        id: req.user.id,
        first_name: req.user.firstName,
        last_name: req.user.lastName,
        email: req.user.email
      }
    }
    return next()
  }

  // Save the original URL to redirect after login
  req.session.returnTo = req.originalUrl
  res.redirect('/auth/sign-in')
}

/// ------------------------------------------------------------------------ ///
/// ALL ROUTES
/// ------------------------------------------------------------------------ ///
router.all('*', (req, res, next) => {
  res.locals.referrer = req.query.referrer
  res.locals.query = req.query
  res.locals.flash = req.flash('success') // pass through 'success' messages only
  next()
})

/// ------------------------------------------------------------------------ ///
/// AUTHENTICATION ROUTES
/// ------------------------------------------------------------------------ ///
router.get('/auth/sign-in', authenticationController.signIn_get)
router.get('/auth/sign-in/email', authenticationController.signInEmail_get)
router.post('/auth/sign-in/email', authenticationController.signInEmail_post)
router.get('/auth/sign-in/password', authenticationController.signInPassword_get)
router.post('/auth/sign-in/password', authenticationController.signInPassword_post)
router.get('/auth/persona', authenticationController.persona_get)
router.post('/auth/persona', authenticationController.persona_post)
router.get('/auth/sign-out', authenticationController.signOut_get)

// Redirect /support/sign-out to new auth route for backwards compatibility
router.get('/support/sign-out', (req, res) => {
  res.redirect('/auth/sign-out')
})

/// ------------------------------------------------------------------------ ///
/// HOMEPAGE ROUTE
/// ------------------------------------------------------------------------ ///
router.get('/support', checkIsAuthenticated, (req, res) => {
  res.redirect('/support/placement-schools')
})

/// ------------------------------------------------------------------------ ///
/// SEARCH ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/search', searchController.search_get)
router.post('/search', searchController.search_post)

router.get('/search/location', searchController.searchLocation_get)
router.post('/search/location', searchController.searchLocation_post)

router.get('/search/school', searchController.searchSchool_get)
router.post('/search/school', searchController.searchSchool_post)

router.get('/search/provider', searchController.searchProvider_get)
router.post('/search/provider', searchController.searchProvider_post)

router.get('/results/remove-region-filter/:region', searchController.removeRegionFilter)
router.get('/results/remove-school-type-filter/:schoolType', searchController.removeSchoolTypeFilter)
router.get('/results/remove-school-group-filter/:schoolGroup', searchController.removeSchoolGroupFilter)
router.get('/results/remove-school-status-filter/:schoolStatus', searchController.removeSchoolStatusFilter)
router.get('/results/remove-school-education-phase-filter/:schoolEducationPhase', searchController.removeSchoolEducationPhaseFilter)
router.get('/results/remove-academic-year-filter/:academicYear', searchController.removeAcademicYearFilter)
router.get('/results/remove-placement-subject-filter/:placementSubject', searchController.removePlacementSubjectFilter)

router.get('/results/remove-all-filters', searchController.removeAllFilters)

router.get('/results/remove-keyword-search', searchController.removeKeywordSearch)

router.get('/results', searchController.results_get)

/// ------------------------------------------------------------------------ ///
/// SEARCH DATA DOWNLOAD ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/results/location-download', searchController.locationDownload_csv)

router.get('/results/provider-download', searchController.providerDownload_csv)

/// ------------------------------------------------------------------------ ///
/// SUPPORT - PLACEMENT SCHOOL ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/support/placement-schools/remove-school-type-filter/:schoolType', checkIsAuthenticated, supportPlacementSchoolController.removeSchoolTypeFilter)
router.get('/support/placement-schools/remove-school-group-filter/:schoolGroup', checkIsAuthenticated, supportPlacementSchoolController.removeSchoolGroupFilter)
router.get('/support/placement-schools/remove-school-status-filter/:schoolStatus', checkIsAuthenticated, supportPlacementSchoolController.removeSchoolStatusFilter)
router.get('/support/placement-schools/remove-school-education-phase-filter/:schoolEducationPhase', checkIsAuthenticated, supportPlacementSchoolController.removeSchoolEducationPhaseFilter)
router.get('/support/placement-schools/remove-academic-year-filter/:academicYear', checkIsAuthenticated, supportPlacementSchoolController.removeAcademicYearFilter)
router.get('/support/placement-schools/remove-placement-subject-filter/:placementSubject', checkIsAuthenticated, supportPlacementSchoolController.removePlacementSubjectFilter)
router.get('/support/placement-schools/remove-provider-filter/:provider', checkIsAuthenticated, supportPlacementSchoolController.removeProviderFilter)

router.get('/support/placement-schools/remove-all-filters', checkIsAuthenticated, supportPlacementSchoolController.removeAllFilters)

router.get('/support/placement-schools/remove-keyword-search', checkIsAuthenticated, supportPlacementSchoolController.removeKeywordSearch)

router.get('/support/placement-schools/:schoolId/location', checkIsAuthenticated, supportPlacementSchoolController.placementSchoolLocation)
router.get('/support/placement-schools/:schoolId/placements', checkIsAuthenticated, supportPlacementSchoolController.placementSchoolPlacements)

router.get('/support/placement-schools/:schoolId', checkIsAuthenticated, supportPlacementSchoolController.placementSchoolDetails)

router.get('/support/placement-schools', checkIsAuthenticated, supportPlacementSchoolController.placementSchoolsList)

/// ------------------------------------------------------------------------ ///
/// SUPPORT - USER ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/support/users/new', checkIsAuthenticated, supportUserController.newUser_get)
router.post('/support/users/new', checkIsAuthenticated, supportUserController.newUser_post)

router.get('/support/users/new/check', checkIsAuthenticated, supportUserController.newUserCheck_get)
router.post('/support/users/new/check', checkIsAuthenticated, supportUserController.newUserCheck_post)

router.get('/support/users/:userId/edit', checkIsAuthenticated, supportUserController.editUser_get)
router.post('/support/users/:userId/edit', checkIsAuthenticated, supportUserController.editUser_post)

router.get('/support/users/:userId/edit/check', checkIsAuthenticated, supportUserController.editUserCheck_get)
router.post('/support/users/:userId/edit/check', checkIsAuthenticated, supportUserController.editUserCheck_post)

router.get('/support/users/:userId/delete', checkIsAuthenticated, supportUserController.deleteUser_get)
router.post('/support/users/:userId/delete', checkIsAuthenticated, supportUserController.deleteUser_post)

router.get('/support/users/:userId', checkIsAuthenticated, supportUserController.userDetails)

router.get('/support/users', checkIsAuthenticated, supportUserController.usersList)

/// ------------------------------------------------------------------------ ///
/// SUPPORT - YOUR ACCOUNT ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/support/account', checkIsAuthenticated, supportAccountController.userAccount)

/// ------------------------------------------------------------------------ ///
/// FEEDBACK ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/feedback', feedbackController.newFeedback_get)
router.post('/feedback', feedbackController.newFeedback_post)

router.get('/feedback/check', feedbackController.newFeedbackCheck_get)
router.post('/feedback/check', feedbackController.newFeedbackCheck_post)

router.get('/feedback/confirmation', feedbackController.newFeedbackConfirmation_get)

/// ------------------------------------------------------------------------ ///
/// GENERAL ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/accessibility', contentController.accessibility)

router.get('/cookies', contentController.cookies)

router.get('/privacy', contentController.privacy)

router.get('/404', checkIsAuthenticated, errorController.pageNotFound)
router.get('/page-not-found', checkIsAuthenticated, errorController.pageNotFound)

router.get('/500', errorController.unexpectedError)
router.get('/server-error', errorController.unexpectedError)

router.get('/503', errorController.serviceUnavailable)
router.get('/service-unavailable', errorController.serviceUnavailable)

router.get('/unauthorised', errorController.unauthorised)
router.get('/account-not-authorised', errorController.unauthorised)

router.get('/account-not-recognised', errorController.accountNotRecognised)

router.get('/account-no-organisation', errorController.accountNoOrganisation)

/// ------------------------------------------------------------------------ ///
/// AUTOCOMPLETE ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/location-suggestions', searchController.locationSuggestions_json)

router.get('/provider-suggestions', searchController.providerSuggestions_json)

router.get('/school-suggestions', searchController.schoolSuggestions_json)

/// ------------------------------------------------------------------------ ///
///
/// ------------------------------------------------------------------------ ///

module.exports = router
