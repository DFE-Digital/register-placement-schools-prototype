const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class SchoolRelationshipTypeGroup extends Model {
    static associate(models) {
      SchoolRelationshipTypeGroup.hasMany(models.SchoolRelationshipType, {
        foreignKey: 'relationshipTypeGroupId',
        as: 'relationshipTypes'
      })

      SchoolRelationshipTypeGroup.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      SchoolRelationshipTypeGroup.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  SchoolRelationshipTypeGroup.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at'
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'created_by_id'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at'
      },
      updatedById: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'updated_by_id'
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at'
      },
      deletedById: {
        type: DataTypes.UUID,
        field: 'deleted_by_id'
      }
    },
    {
      sequelize,
      modelName: 'SchoolRelationshipTypeGroup',
      tableName: 'school_relationship_type_groups',
      timestamps: true
    }
  )

  return SchoolRelationshipTypeGroup
}
