const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class PlacementSchool extends Model {
    static associate(models) {
      PlacementSchool.belongsTo(models.School, {
        foreignKey: 'schoolId',
        as: 'school'
      })

      PlacementSchool.belongsTo(models.Provider, {
        foreignKey: 'providerId',
        as: 'provider'
      })

      PlacementSchool.belongsTo(models.AcademicYear, {
        foreignKey: 'academicYearId',
        as: 'academicYear'
      })

      PlacementSchool.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      PlacementSchool.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  PlacementSchool.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      schoolId:  {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'school_id'
      },
      providerId:  {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'provider_id'
      },
      academicYearId:  {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'academic_year_id'
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
      modelName: 'PlacementSchool',
      tableName: 'placement_schools',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // PlacementSchool.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'PlacementSchoolRevision', modelKey: 'placementSchool' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // PlacementSchool.addHook('afterUpdate', (instance, options) => {
  //   const hookName = instance.deletedById !== null ? 'afterDestroy' : 'afterUpdate'
  //   createRevisionHook({ revisionModelName: 'PlacementSchoolRevision', modelKey: 'placementSchool' })(instance, {
  //     ...options,
  //     hookName
  //   })
  // })

  return PlacementSchool
}
