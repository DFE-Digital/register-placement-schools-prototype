module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('school_relationships', {
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
      related_school_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id'
        }
      },
      relationship_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'school_relationship_types',
          key: 'id'
        }
      },
      related_at: {
        type: Sequelize.DATE
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
    await queryInterface.addIndex('school_relationships', {
      fields: ['school_id'],
      name: 'idx_school_relationships_school_id'
    })
    await queryInterface.addIndex('school_relationships', {
      fields: ['related_school_id'],
      name: 'idx_school_relationships_related_school_id'
    })
    await queryInterface.addIndex('school_relationships', {
      fields: ['relationship_type_id'],
      name: 'idx_school_relationships_relationship_type_id'
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('school_relationships')
  }
}
