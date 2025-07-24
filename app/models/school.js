const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class School extends Model {
    static associate(models) {
      School.hasOne(models.SchoolAddress, {
        foreignKey: 'schoolId',
        as: 'schoolAddress'
      })

      School.hasOne(models.SchoolDetail, {
        foreignKey: 'schoolId',
        as: 'schoolDetail'
      })

      School.hasMany(models.PlacementSchool, {
        foreignKey: 'schoolId',
        as: 'placements'
      })

      School.belongsTo(models.SchoolType, {
        foreignKey: 'typeCode',
        targetKey: 'code',
        as: 'schoolType'
      })

      School.belongsTo(models.SchoolGroup, {
        foreignKey: 'groupCode',
        targetKey: 'code',
        as: 'schoolGroup'
      })

      School.belongsTo(models.SchoolStatus, {
        foreignKey: 'statusCode',
        targetKey: 'code',
        as: 'schoolStatus'
      })

      School.belongsTo(models.SchoolEducationPhase, {
        foreignKey: 'educationPhaseCode',
        targetKey: 'code',
        as: 'schoolEducationPhase'
      })

      School.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      School.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  School.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      urn: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      ukprn: {
        type: DataTypes.STRING
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      typeCode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'type_code',
        validate: {
          notEmpty: true
        }
      },
      groupCode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'group_code',
        validate: {
          notEmpty: true
        }
      },
      statusCode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'status_code',
        validate: {
          notEmpty: true
        }
      },
      educationPhaseCode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'education_phase_code',
        validate: {
          notEmpty: true
        }
      },
      website: {
        type: DataTypes.STRING
      },
      telephone: {
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
      modelName: 'School',
      tableName: 'schools',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // School.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'SchoolRevision', modelKey: 'school' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // School.addHook('afterUpdate', (instance, options) => {
  //   const hookName = instance.deletedById !== null ? 'afterDestroy' : 'afterUpdate'
  //   createRevisionHook({ revisionModelName: 'SchoolRevision', modelKey: 'school' })(instance, {
  //     ...options,
  //     hookName
  //   })
  // })

  return School
}
