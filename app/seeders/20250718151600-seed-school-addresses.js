const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

// const createRevision = require('./helpers/createRevision')
// const createActivityLog = require('./helpers/createActivityLog')
const { nullIfEmpty } = require('../helpers/string')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.bulkDelete('school_addresses', null, { transaction })
      // await queryInterface.bulkDelete('school_address_revisions', null, { transaction })
      // await queryInterface.bulkDelete('activity_logs', {
      //   entity_type: 'school_address'
      // }, { transaction })

      const files = [
        '20250718151700-seed-school-addresses-open.json',
        '20250718151701-seed-school-addresses-other.json'
      ]

      const schoolAddresses = files.flatMap(file =>
        JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'))
      )

      const createdAt = new Date()
      const userId = '354751f2-c5f7-483c-b9e4-b6103f50f970'

      for (const address of schoolAddresses) {
        if (!address.address1 || !address.town || !address.postcode) continue

        const addressId = uuidv4()
        // const revisionNumber = 1

        const baseFields = {
          id: addressId,
          school_id: address.school_id,
          line_1: address.address1,
          line_2: nullIfEmpty(address.address2),
          line_3: nullIfEmpty(address.address3),
          town: address.town,
          county: nullIfEmpty(address.county),
          postcode: address.postcode,
          latitude: nullIfEmpty(address.latitude),
          longitude: nullIfEmpty(address.longitude),
          created_at: createdAt,
          created_by_id: userId,
          updated_at: createdAt,
          updated_by_id: userId
        }

        // 1. Insert address
        await queryInterface.bulkInsert('school_addresses', [baseFields], { transaction })

        // 2. Insert revision
        // const { id: _, ...revisionData } = baseFields

        // const revisionId = await createRevision({
        //   revisionTable: 'school_address_revisions',
        //   entityId: addressId,
        //   revisionData,
        //   revisionNumber,
        //   userId,
        //   timestamp: createdAt
        // }, queryInterface, transaction)

        // 3. Insert activity log
        // await createActivityLog({
        //   revisionTable: 'school_address_revisions',
        //   revisionId,
        //   entityType: 'school_address',
        //   entityId: addressId,
        //   revisionNumber,
        //   changedById: userId,
        //   changedAt: createdAt
        // }, queryInterface, transaction)
      }

      await transaction.commit()
    } catch (error) {
      // console.error('school address seeding error with revisions and activity logs:', error)
      console.error('school address seeding error:', error)
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('activity_logs', {
    //   entity_type: 'school_address'
    // })
    // await queryInterface.bulkDelete('school_address_revisions', null, {})
    await queryInterface.bulkDelete('school_addresses', null, {})
  }
}
