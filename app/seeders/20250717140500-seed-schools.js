const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

// const createRevision = require('./helpers/createRevision')
// const createActivityLog = require('./helpers/createActivityLog')
const { nullIfEmpty } = require('../helpers/string')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.bulkDelete('schools', null, { transaction })
      // await queryInterface.bulkDelete('school_revisions', null, { transaction })
      // await queryInterface.bulkDelete('activity_logs', {
      //   entity_type: 'school'
      // }, { transaction })

      const csvPath = path.join(__dirname, '/data/seed-schools.csv')
      const csvContent = fs.readFileSync(csvPath, 'utf8')

      const schools = parse(csvContent, {
        columns: true, // use header row as keys
        skip_empty_lines: true,
        trim: true
      })

      const createdAt = new Date()
      const userId = '354751f2-c5f7-483c-b9e4-b6103f50f970'

      for (const school of schools) {
        const schoolId = school.id
        // const revisionNumber = 1

        // Prepare base fields for both insert and revision
        const baseFields = {
          id: schoolId,
          urn: school.urn,
          ukprn: nullIfEmpty(school.ukprn),
          name: school.name,
          type_code: school.type_code,
          group_code: school.group_code,
          status_code: school.status_code,
          education_phase_code: school.education_phase_code,
          website: nullIfEmpty(school.website),
          telephone: nullIfEmpty(school.telephone),
          created_at: createdAt,
          created_by_id: userId,
          updated_at: createdAt,
          updated_by_id: userId
        }

        // 1. Insert school
        await queryInterface.bulkInsert('schools', [baseFields], { transaction })

        // 2. Insert revision using helper
        // const { id: _, ...revisionData } = baseFields

        // const revisionId = await createRevision({
        //   revisionTable: 'school_revisions',
        //   entityId: schoolId,
        //   revisionData,
        //   revisionNumber,
        //   userId,
        //   timestamp: createdAt
        // }, queryInterface, transaction)

        // 3. Insert activity log using helper
        // await createActivityLog({
        //   revisionTable: 'school_revisions',
        //   revisionId,
        //   entityType: 'school',
        //   entityId: schoolId,
        //   revisionNumber,
        //   changedById: userId,
        //   changedAt: createdAt
        // }, queryInterface, transaction)
      }

      await transaction.commit()
    } catch (error) {
      // console.error('school seeding error with revisions and activity logs:', error)
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('activity_logs', {
    //   entity_type: 'school'
    // })
    // await queryInterface.bulkDelete('school_revisions', null, {})
    await queryInterface.bulkDelete('schools', null, {})
  }
}
