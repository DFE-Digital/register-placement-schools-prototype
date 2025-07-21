module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('school_addresses', {
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
      line_1:  {
        type: Sequelize.STRING,
        allowNull: false
      },
      line_2: {
        type: Sequelize.STRING
      },
      line_3: {
        type: Sequelize.STRING
      },
      town:  {
        type: Sequelize.STRING,
        allowNull: false
      },
      county: {
        type: Sequelize.STRING
      },
      postcode:  {
        type: Sequelize.STRING,
        allowNull: false
      },
      latitude: {
        type: Sequelize.FLOAT
      },
      longitude: {
        type: Sequelize.FLOAT
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
    await queryInterface.dropTable('school_addresses')
  }
}
