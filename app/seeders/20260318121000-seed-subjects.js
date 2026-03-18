const fs = require('fs')
const path = require('path')

// const createRevision = require('./helpers/createRevision')
// const createActivityLog = require('./helpers/createActivityLog')

const toCode = (value) => {
  if (!value) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.bulkDelete('subjects', null, { transaction })
      // await queryInterface.bulkDelete('subject_revisions', null, { transaction })
      // await queryInterface.bulkDelete('activity_logs', {
      //   entity_type: 'subject'
      // }, { transaction })

      const createdAt = new Date()
      const systemUserId = '354751f2-c5f7-483c-b9e4-b6103f50f970' // Acting user ID for changes
      // const revisionNumber = 1

      const items = JSON.parse(fs.readFileSync(path.join(__dirname, '/data/see-subjects.json'), 'utf8'))

      for (const item of items) {
        const baseFields = {
          id: item.id,
          code: item.code || toCode(item.name),
          name: item.name,
          created_by_id: systemUserId,
          created_at: createdAt,
          updated_by_id: systemUserId,
          updated_at: createdAt
        }

        // 1. Insert into users table
        await queryInterface.bulkInsert('subjects', [baseFields], { transaction })

        // 2. Create revision
        // const { id: _, ...revisionDataWithoutId } = baseFields

        // const revisionId = await createRevision({
        //   revisionTable: 'subject_revisions',
        //   entityId: item.id,
        //   revisionData: revisionDataWithoutId,
        //   revisionNumber,
        //   userId: systemUserId,
        //   timestamp: createdAt
        // }, queryInterface, transaction)

        // 3. Create activity log
        // await createActivityLog({
        //   revisionTable: 'subject_revisions',
        //   revisionId,
        //   entityType: 'subject',
        //   entityId: item.id,
        //   revisionNumber,
        //   changedById: systemUserId,
        //   changedAt: createdAt
        // }, queryInterface, transaction)
      }

      await transaction.commit()
    } catch (error) {
      // console.error('Subjects seeding error with revisions and activity logs:', error)
      console.error('Subjects seeding error:', error)
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('activity_logs', {
    //   entity_type: 'subject'
    // })
    // await queryInterface.bulkDelete('subject_revisions', null, {})
    await queryInterface.bulkDelete('subjects', null, {})
  }
}
