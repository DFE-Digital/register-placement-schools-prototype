const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class SchoolRelationshipType extends Model {
    static associate(models) {
      SchoolRelationshipType.hasMany(models.SchoolRelationship, {
        foreignKey: 'relationshipTypeId',
        as: 'relationships'
      })

      SchoolRelationshipType.belongsTo(models.SchoolRelationshipTypeGroup, {
        foreignKey: 'relationshipTypeGroupId',
        as: 'relationshipTypeGroup'
      })

      SchoolRelationshipType.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      SchoolRelationshipType.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  SchoolRelationshipType.init(
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
      relationshipTypeGroupId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'relationship_type_group_id'
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
      modelName: 'SchoolRelationshipType',
      tableName: 'school_relationship_types',
      timestamps: true
    }
  )

  return SchoolRelationshipType
}
