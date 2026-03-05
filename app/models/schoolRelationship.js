const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class SchoolRelationship extends Model {
    static associate(models) {
      SchoolRelationship.belongsTo(models.School, {
        foreignKey: 'schoolId',
        as: 'school'
      })

      SchoolRelationship.belongsTo(models.School, {
        foreignKey: 'relatedSchoolId',
        as: 'relatedSchool'
      })

      SchoolRelationship.belongsTo(models.SchoolRelationshipType, {
        foreignKey: 'relationshipTypeId',
        as: 'relationshipType'
      })

      SchoolRelationship.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      SchoolRelationship.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  SchoolRelationship.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      schoolId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'school_id'
      },
      relatedSchoolId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'related_school_id'
      },
      relationshipTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'relationship_type_id'
      },
      relatedAt: {
        type: DataTypes.DATE,
        field: 'related_at'
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
      modelName: 'SchoolRelationship',
      tableName: 'school_relationships',
      timestamps: true
    }
  )

  return SchoolRelationship
}
