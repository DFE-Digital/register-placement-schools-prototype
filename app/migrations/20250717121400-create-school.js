module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schools', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      urn: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ukprn: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      group_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      education_phase_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      website: {
        type: Sequelize.STRING
      },
      telephone: {
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
    await queryInterface.dropTable('schools')
  }
}
