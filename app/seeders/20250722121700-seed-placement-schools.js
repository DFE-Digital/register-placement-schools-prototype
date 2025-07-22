const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

// const createRevision = require('./helpers/createRevision')
// const createActivityLog = require('./helpers/createActivityLog')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.bulkDelete('placement_schools', null, { transaction })
      // await queryInterface.bulkDelete('placement_school_revisions', null, { transaction })
      // await queryInterface.bulkDelete('activity_logs', {
      //   entity_type: 'placement_school'
      // }, { transaction })

      const csvPath = path.join(__dirname, '/data/seed-placement-schools.csv')
      const csvContent = fs.readFileSync(csvPath, 'utf8')

      const placementSchools = parse(csvContent, {
        columns: true, // use header row as keys
        skip_empty_lines: true,
        trim: true
      })

      const createdAt = new Date()
      const userId = '354751f2-c5f7-483c-b9e4-b6103f50f970'

      for (const placementSchool of placementSchools) {
        const placementSchoolId = placementSchool.id
        // const revisionNumber = 1

        // Prepare base fields for both insert and revision
        const baseFields = {
          id: placementSchoolId,
          school_id: placementSchool.schoolId,
          provider_id: placementSchool.providerId,
          academic_year_id: placementSchool.academicYearId,
          created_at: createdAt,
          created_by_id: userId,
          updated_at: createdAt,
          updated_by_id: userId
        }

        // 1. Insert placement_school
        await queryInterface.bulkInsert('placement_schools', [baseFields], { transaction })

        // 2. Insert revision using helper
        // const { id: _, ...revisionData } = baseFields

        // const revisionId = await createRevision({
        //   revisionTable: 'placement_school_revisions',
        //   entityId: placementSchoolId,
        //   revisionData,
        //   revisionNumber,
        //   userId,
        //   timestamp: createdAt
        // }, queryInterface, transaction)

        // 3. Insert activity log using helper
        // await createActivityLog({
        //   revisionTable: 'placement_school_revisions',
        //   revisionId,
        //   entityType: 'placement_school',
        //   entityId: placementSchoolId,
        //   revisionNumber,
        //   changedById: userId,
        //   changedAt: createdAt
        // }, queryInterface, transaction)
      }

      await transaction.commit()
    } catch (error) {
      // console.error('placement_school seeding error with revisions and activity logs:', error)
      console.error('placement_school seeding error:', error)
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('activity_logs', {
    //   entity_type: 'placement_school'
    // })
    // await queryInterface.bulkDelete('placement_school_revisions', null, {})
    await queryInterface.bulkDelete('placement_schools', null, {})
  }
}
