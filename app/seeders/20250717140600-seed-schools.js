const fs = require('fs')
const path = require('path')

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

      const files = [
        '20250717140600-seed-schools-open.json',
        '20250717140601-seed-schools-other.json'
      ]

      const schools = files.flatMap(file =>
        JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'))
      )

      // const dataPath = path.join(__dirname, '20250717140600-seed-schools-open.json')
      // const rawData = fs.readFileSync(dataPath, 'utf8')
      // const schools = JSON.parse(rawData)

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
          type: school.type,
          group: school.group,
          status: school.status,
          education_phase: school.education_phase,
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
