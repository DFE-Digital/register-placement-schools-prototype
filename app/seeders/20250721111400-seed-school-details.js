const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')
const { v4: uuidv4 } = require('uuid')

// const createRevision = require('./helpers/createRevision')
// const createActivityLog = require('./helpers/createActivityLog')
const { nullIfEmpty } = require('../helpers/string')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction()

    try {
      await queryInterface.bulkDelete('school_details', null, { transaction })
      // await queryInterface.bulkDelete('school_detail_revisions', null, { transaction })
      // await queryInterface.bulkDelete('activity_logs', {
      //   entity_type: 'school_detail'
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
        const detailId = uuidv4()
        // const revisionNumber = 1

        const baseFields = {
          id: detailId,
          school_id: school.id,
          establishment_number: nullIfEmpty(school.establishment_number),
          local_authority_code: nullIfEmpty(school.local_authority_code),
          statutory_low_age: nullIfEmpty(school.statutory_low_age),
          statutory_high_age: nullIfEmpty(school.statutory_high_age),
          boarders_code: nullIfEmpty(school.boarders_code),
          nursery_provision_code: nullIfEmpty(school.nursery_provision_code),
          official_six_form_code: nullIfEmpty(school.official_six_form_code),
          gender_code: nullIfEmpty(school.gender_code),
          religious_character_code: nullIfEmpty(school.religious_character_code),
          admissions_policy_code: nullIfEmpty(school.admissions_policy_code),
          special_classes_code: nullIfEmpty(school.special_classes_code),
          school_capacity: nullIfEmpty(school.school_capacity),
          number_of_boys: nullIfEmpty(school.number_of_boys),
          number_of_girls: nullIfEmpty(school.number_of_girls),
          percentage_free_school_meals: nullIfEmpty(school.percentage_free_school_meals),
          district_administrative_code: nullIfEmpty(school.district_administrative_code),
          administrative_ward_code: nullIfEmpty(school.administrative_ward_code),
          parliamentary_constituency_code: nullIfEmpty(school.parliamentary_constituency_code),
          urban_rural_code: nullIfEmpty(school.urban_rural_code),
          gss_local_authority_code: nullIfEmpty(school.gss_local_authority_code),
          msoa_code: nullIfEmpty(school.msoa_code),
          lsoa_code: nullIfEmpty(school.lsoa_code),
          created_at: createdAt,
          created_by_id: userId,
          updated_at: createdAt,
          updated_by_id: userId
        }

        // 1. Insert address
        await queryInterface.bulkInsert('school_details', [baseFields], { transaction })

        // 2. Insert revision
        // const { id: _, ...revisionData } = baseFields

        // const revisionId = await createRevision({
        //   revisionTable: 'school_detail_revisions',
        //   entityId: detailId,
        //   revisionData,
        //   revisionNumber,
        //   userId,
        //   timestamp: createdAt
        // }, queryInterface, transaction)

        // 3. Insert activity log
        // await createActivityLog({
        //   revisionTable: 'school_detail_revisions',
        //   revisionId,
        //   entityType: 'school_detail',
        //   entityId: detailId,
        //   revisionNumber,
        //   changedById: userId,
        //   changedAt: createdAt
        // }, queryInterface, transaction)
      }

      await transaction.commit()
    } catch (error) {
      // console.error('school detail seeding error with revisions and activity logs:', error)
      console.error('school detail seeding error:', error)
      await transaction.rollback()
      throw error
    }
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.bulkDelete('activity_logs', {
    //   entity_type: 'school_detail'
    // })
    // await queryInterface.bulkDelete('school_detail_revisions', null, {})
    await queryInterface.bulkDelete('school_details', null, {})
  }
}
