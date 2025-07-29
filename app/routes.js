//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

/// ------------------------------------------------------------------------ ///
/// Flash messaging
/// ------------------------------------------------------------------------ ///
const flash = require('connect-flash')
router.use(flash())

/// ------------------------------------------------------------------------ ///
/// User authentication
/// ------------------------------------------------------------------------ ///
// TODO: Replace with Passport
const passport = {
  user: {
    id: '3faa7586-951b-495c-9999-e5fc4367b507',
    first_name: 'Colin',
    last_name: 'Chapman',
    email: 'colin.chapman@example.gov.uk'
  }
}

/// ------------------------------------------------------------------------ ///
/// Controller modules
/// ------------------------------------------------------------------------ ///
const placementSchoolController = require('./controllers/placementSchool')
const searchController = require('./controllers/search')
const locationController = require('./controllers/location')
const providerController = require('./controllers/provider')
const supportAccountController = require('./controllers/support/account')
const supportPlacementSchoolController = require('./controllers/support/placementSchool')
const supportUserController = require('./controllers/support/user')

/// ------------------------------------------------------------------------ ///
/// Authentication middleware
/// ------------------------------------------------------------------------ ///
const checkIsAuthenticated = (req, res, next) => {
  // the signed in user
  req.session.passport = passport
  // the base URL for navigation
  res.locals.baseUrl = `/placement-schools/${req.params.schoolId}`
  res.locals.supportBaseUrl = `/support/placement-schools/${req.params.schoolId}`
  next()
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
/// HOMEPAGE ROUTE
/// ------------------------------------------------------------------------ ///
router.get('/support', (req, res) => {
  res.redirect('/support/placement-schools')
})

// Temporary sign out - does nothing
router.get('/support/sign-out', (req, res) => {
  res.redirect('/support/placement-schools')
})

/// ------------------------------------------------------------------------ ///
/// PLACEMENT SCHOOL ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/search', checkIsAuthenticated, searchController.search_get)
router.post('/search', checkIsAuthenticated, searchController.search_post)

router.get('/search/location', checkIsAuthenticated, searchController.searchLocation_get)
router.post('/search/location', checkIsAuthenticated, searchController.searchLocation_post)

router.get('/search/provider', checkIsAuthenticated, searchController.searchProvider_get)
router.post('/search/provider', checkIsAuthenticated, searchController.searchProvider_post)

/// ------------------------------------------------------------------------ ///
/// SUPPORT - PLACEMENT SCHOOL ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/support/placement-schools/remove-school-type-filter/:schoolType', checkIsAuthenticated, supportPlacementSchoolController.removeSchoolTypeFilter)
router.get('/support/placement-schools/remove-school-group-filter/:schoolGroup', checkIsAuthenticated, supportPlacementSchoolController.removeSchoolGroupFilter)
router.get('/support/placement-schools/remove-school-status-filter/:schoolStatus', checkIsAuthenticated, supportPlacementSchoolController.removeSchoolStatusFilter)
router.get('/support/placement-schools/remove-school-education-phase-filter/:schoolEducationPhase', checkIsAuthenticated, supportPlacementSchoolController.removeSchoolEducationPhaseFilter)

router.get('/support/placement-schools/remove-all-filters', checkIsAuthenticated, supportPlacementSchoolController.removeAllFilters)

router.get('/support/placement-schools/remove-keyword-search', checkIsAuthenticated, supportPlacementSchoolController.removeKeywordSearch)

router.get('/support/placement-schools/:schoolId/partnerships', checkIsAuthenticated, supportPlacementSchoolController.placementSchoolPartnerships)

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
/// AUTOCOMPLETE ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/provider-suggestions', providerController.providerSuggestions_json)

router.get('/location-suggestions', locationController.locationSuggestions_json)

/// ------------------------------------------------------------------------ ///
///
/// ------------------------------------------------------------------------ ///

module.exports = router
