module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('school_details', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id'
        }
      },
      establishment_number: {
        type: Sequelize.STRING
      },
      local_authority_code: {
        type: Sequelize.STRING
      },
      statutory_low_age: {
        type: Sequelize.INTEGER
      },
      statutory_high_age: {
        type: Sequelize.INTEGER
      },
      boarders_code: {
        type: Sequelize.STRING
      },
      nursery_provision_code: {
        type: Sequelize.STRING
      },
      official_six_form_code: {
        type: Sequelize.STRING
      },
      gender_code: {
        type: Sequelize.STRING
      },
      religious_character_code: {
        type: Sequelize.STRING
      },
      admissions_policy_code: {
        type: Sequelize.STRING
      },
      special_classes_code: {
        type: Sequelize.STRING
      },
      school_capacity: {
        type: Sequelize.INTEGER
      },
      number_of_boys: {
        type: Sequelize.INTEGER
      },
      number_of_girls: {
        type: Sequelize.INTEGER
      },
      percentage_free_school_meals: {
        type: Sequelize.DECIMAL
      },
      district_administrative_code: {
        type: Sequelize.STRING
      },
      administrative_ward_code: {
        type: Sequelize.STRING
      },
      parliamentary_constituency_code: {
        type: Sequelize.STRING
      },
      urban_rural_code: {
        type: Sequelize.STRING
      },
      gss_local_authority_code: {
        type: Sequelize.STRING
      },
      easting: {
        type: Sequelize.STRING
      },
      northing: {
        type: Sequelize.STRING
      },
      msoa_code: {
        type: Sequelize.STRING
      },
      lsoa_code: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'The user who made the change'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'The user who made the change'
      },
      deleted_at: {
        type: Sequelize.DATE
      },
      deleted_by_id: {
        type: Sequelize.UUID,
        comment: 'The user who made the change'
      }
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('school_details')
  }
}
