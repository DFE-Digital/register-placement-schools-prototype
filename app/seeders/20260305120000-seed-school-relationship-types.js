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
      await queryInterface.bulkDelete('school_relationship_types', null, { transaction })
      // await queryInterface.bulkDelete('school_relationship_type_revisions', null, { transaction })
      // await queryInterface.bulkDelete('activity_logs', {
      //   entity_type: 'school_relationship_type'
      // }, { transaction })

      const csvPath = path.join(__dirname, '/data/seed-school-relationship-types.csv')
      const csvContent = fs.readFileSync(csvPath, 'utf8')

      const relationshipTypes = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })

      const createdAt = new Date()
      const userId = '354751f2-c5f7-483c-b9e4-b6103f50f970'

      for (const relationshipType of relationshipTypes) {
        const relationshipTypeId = nullIfEmpty(relationshipType.id)
        const name = nullIfEmpty(relationshipType.name)

        if (!relationshipTypeId || !name) continue

        const baseFields = {
          id: relationshipTypeId,
          name,
          description: nullIfEmpty(relationshipType.description),
          created_at: createdAt,
          created_by_id: userId,
          updated_at: createdAt,
          updated_by_id: userId
        }

        await queryInterface.bulkInsert('school_relationship_types', [baseFields], { transaction })
      }

      await transaction.commit()
    } catch (error) {
      console.error('School relationship type seeding error:', error)
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('activity_logs', {
    //   entity_type: 'school_relationship_type'
    // })
    // await queryInterface.bulkDelete('school_relationship_type_revisions', null, {})
    await queryInterface.bulkDelete('school_relationship_types', null, {})
  }
}
