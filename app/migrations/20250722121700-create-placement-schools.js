module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('placement_schools', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      school_id:  {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id'
        }
      },
      provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'providers',
          key: 'id'
        }
      },
      academic_year_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'academic_years',
          key: 'id'
        }
      },
      subject_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'subjects',
          key: 'id'
        }
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

    // indexes
    await queryInterface.addIndex('placement_schools', {
      fields: ['school_id'],
      name: 'idx_placement_schools_school_id'
    })
    await queryInterface.addIndex('placement_schools', {
      fields: ['provider_id'],
      name: 'idx_placement_schools_provider_id'
    })
    await queryInterface.addIndex('placement_schools', {
      fields: ['academic_year_id'],
      name: 'idx_placement_schools_academic_year_id'
    })
    await queryInterface.addIndex('placement_schools', {
      fields: ['subject_id'],
      name: 'idx_placement_schools_subject_id'
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('placement_schools')
  }
}
