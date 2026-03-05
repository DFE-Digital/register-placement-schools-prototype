const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')
const { v4: uuidv4 } = require('uuid')

// const createRevision = require('./helpers/createRevision')
// const createActivityLog = require('./helpers/createActivityLog')
const { nullIfEmpty } = require('../helpers/string')

const parseDate = (value) => {
  const trimmed = nullIfEmpty(value)
  if (!trimmed) return null

  const [day, month, year] = String(trimmed).split('/')
  if (!day || !month || !year) return null

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.bulkDelete('school_relationships', null, { transaction })
      // await queryInterface.bulkDelete('school_relationship_revisions', null, { transaction })
      // await queryInterface.bulkDelete('activity_logs', {
      //   entity_type: 'school_relationship'
      // }, { transaction })

      const csvPath = path.join(__dirname, '/data/seed-school-relationships.csv')
      const csvContent = fs.readFileSync(csvPath, 'utf8')

      const relationships = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })

      const createdAt = new Date()
      const userId = '354751f2-c5f7-483c-b9e4-b6103f50f970'

      for (const relationship of relationships) {
        const schoolId = nullIfEmpty(relationship.school_id)
        const relatedSchoolId = nullIfEmpty(relationship.related_school_id)
        const relationshipTypeId = nullIfEmpty(relationship.relationship_type_id)

        if (!schoolId || !relatedSchoolId || !relationshipTypeId) continue

        const baseFields = {
          id: uuidv4(),
          school_id: schoolId,
          related_school_id: relatedSchoolId,
          relationship_type_id: relationshipTypeId,
          related_at: parseDate(relationship.related_at),
          created_at: createdAt,
          created_by_id: userId,
          updated_at: createdAt,
          updated_by_id: userId
        }

        await queryInterface.bulkInsert('school_relationships', [baseFields], { transaction })
      }

      await transaction.commit()
    } catch (error) {
      console.error('School relationship seeding error:', error)
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('activity_logs', {
    //   entity_type: 'school_relationship'
    // })
    // await queryInterface.bulkDelete('school_relationship_revisions', null, {})
    await queryInterface.bulkDelete('school_relationships', null, {})
  }
}
