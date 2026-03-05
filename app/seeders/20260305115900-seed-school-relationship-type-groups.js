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
      await queryInterface.bulkDelete('school_relationship_type_groups', null, { transaction })
      // await queryInterface.bulkDelete('school_relationship_type_group_revisions', null, { transaction })
      // await queryInterface.bulkDelete('activity_logs', {
      //   entity_type: 'school_relationship_type_group'
      // }, { transaction })

      const csvPath = path.join(__dirname, '/data/seed-school-relationships-type-groups.csv')
      const csvContent = fs.readFileSync(csvPath, 'utf8')

      const relationshipTypeGroups = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })

      const createdAt = new Date()
      const userId = '354751f2-c5f7-483c-b9e4-b6103f50f970'

      for (const relationshipTypeGroup of relationshipTypeGroups) {
        const relationshipTypeGroupId = nullIfEmpty(relationshipTypeGroup.id)
        const name = nullIfEmpty(relationshipTypeGroup.name)

        if (!relationshipTypeGroupId || !name) continue

        const baseFields = {
          id: relationshipTypeGroupId,
          name,
          description: nullIfEmpty(relationshipTypeGroup.description),
          created_at: createdAt,
          created_by_id: userId,
          updated_at: createdAt,
          updated_by_id: userId
        }

        await queryInterface.bulkInsert('school_relationship_type_groups', [baseFields], { transaction })
      }

      await transaction.commit()
    } catch (error) {
      console.error('School relationship type group seeding error:', error)
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('activity_logs', {
    //   entity_type: 'school_relationship_type_group'
    // })
    // await queryInterface.bulkDelete('school_relationship_type_group_revisions', null, {})
    await queryInterface.bulkDelete('school_relationship_type_groups', null, {})
  }
}
