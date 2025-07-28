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
const accountController = require('./controllers/account')
const supportPlacementSchoolController = require('./controllers/support/placementSchool')
const userController = require('./controllers/user')

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
router.get('/', (req, res) => {
  res.redirect('/support/placement-schools')
})

/// ------------------------------------------------------------------------ ///
/// PLACEMENT SCHOOL ROUTES
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
/// USER ROUTES
/// ------------------------------------------------------------------------ ///
router.get('/users/new', checkIsAuthenticated, userController.newUser_get)
router.post('/users/new', checkIsAuthenticated, userController.newUser_post)

router.get('/users/new/check', checkIsAuthenticated, userController.newUserCheck_get)
router.post('/users/new/check', checkIsAuthenticated, userController.newUserCheck_post)

router.get('/users/:userId/edit', checkIsAuthenticated, userController.editUser_get)
router.post('/users/:userId/edit', checkIsAuthenticated, userController.editUser_post)

router.get('/users/:userId/edit/check', checkIsAuthenticated, userController.editUserCheck_get)
router.post('/users/:userId/edit/check', checkIsAuthenticated, userController.editUserCheck_post)

router.get('/users/:userId/delete', checkIsAuthenticated, userController.deleteUser_get)
router.post('/users/:userId/delete', checkIsAuthenticated, userController.deleteUser_post)

router.get('/users/:userId', checkIsAuthenticated, userController.userDetails)

router.get('/users', checkIsAuthenticated, userController.usersList)

/// ------------------------------------------------------------------------ ///
/// MY ACCOUNT ROUTES
/// ------------------------------------------------------------------------ ///

router.get('/account', checkIsAuthenticated, accountController.userAccount)

/// ------------------------------------------------------------------------ ///
///
/// ------------------------------------------------------------------------ ///

module.exports = router
