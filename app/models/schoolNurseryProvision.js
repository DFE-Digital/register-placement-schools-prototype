const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class SchoolNurseryProvision extends Model {
    static associate(models) {
      SchoolNurseryProvision.hasMany(models.SchoolDetail, {
        foreignKey: 'nurseryProvisionCode',
        sourceKey: 'code',
        as: 'schoolDetails'
      })

      SchoolNurseryProvision.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      SchoolNurseryProvision.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  SchoolNurseryProvision.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      code:  {
        type: DataTypes.STRING,
        allowNull: false
      },
      name:  {
        type: DataTypes.STRING,
        allowNull: false
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
      modelName: 'SchoolNurseryProvision',
      tableName: 'school_nursery_provisions',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // SchoolNurseryProvision.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'SchoolNurseryProvisionRevision', modelKey: 'schoolNurseryProvision' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // SchoolNurseryProvision.addHook('afterUpdate', (instance, options) => {
  //   const hookName = instance.deletedById !== null ? 'afterDestroy' : 'afterUpdate'
  //   createRevisionHook({ revisionModelName: 'SchoolNurseryProvisionRevision', modelKey: 'schoolNurseryProvision' })(instance, {
  //     ...options,
  //     hookName
  //   })
  // })

  return SchoolNurseryProvision
}
