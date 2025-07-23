const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class AcademicYear extends Model {
    static associate(models) {
      AcademicYear.hasMany(models.PlacementSchool, {
        foreignKey: 'academicYearId',
        as: 'placements'
      })

      AcademicYear.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      AcademicYear.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  AcademicYear.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      code:  {
        type: DataTypes.STRING
      },
      name:  {
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
      modelName: 'AcademicYear',
      tableName: 'academic_years',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // AcademicYear.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'AcademicYearRevision', modelKey: 'academicYear' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // AcademicYear.addHook('afterUpdate', (instance, options) => {
  //   const hookName = instance.deletedById !== null ? 'afterDestroy' : 'afterUpdate'
  //   createRevisionHook({ revisionModelName: 'AcademicYearRevision', modelKey: 'academicYear' })(instance, {
  //     ...options,
  //     hookName
  //   })
  // })

  return AcademicYear
}
