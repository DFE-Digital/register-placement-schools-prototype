const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class SchoolAdmissionsPolicy extends Model {
    static associate(models) {
      SchoolAdmissionsPolicy.hasMany(models.SchoolDetail, {
        foreignKey: 'admissionsPolicyCode',
        sourceKey: 'code',
        as: 'schoolDetails'
      })

      SchoolAdmissionsPolicy.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      SchoolAdmissionsPolicy.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  SchoolAdmissionsPolicy.init(
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
      rank:  {
        type: DataTypes.TINYINT
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
      modelName: 'SchoolAdmissionsPolicy',
      tableName: 'school_admissions_policies',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // SchoolAdmissionsPolicy.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'SchoolAdmissionsPolicyRevision', modelKey: 'schoolAdmissionsPolicy' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // SchoolAdmissionsPolicy.addHook('afterUpdate', (instance, options) => {
  //   const hookName = instance.deletedById !== null ? 'afterDestroy' : 'afterUpdate'
  //   createRevisionHook({ revisionModelName: 'SchoolAdmissionsPolicyRevision', modelKey: 'schoolAdmissionsPolicy' })(instance, {
  //     ...options,
  //     hookName
  //   })
  // })

  return SchoolAdmissionsPolicy
}
