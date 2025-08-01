const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class SchoolUrbanRuralLocation extends Model {
    static associate(models) {
      SchoolUrbanRuralLocation.hasMany(models.SchoolDetail, {
        foreignKey: 'urbanRuralCode',
        sourceKey: 'code',
        as: 'schoolDetails'
      })

      SchoolUrbanRuralLocation.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      SchoolUrbanRuralLocation.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  SchoolUrbanRuralLocation.init(
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
      modelName: 'SchoolUrbanRuralLocation',
      tableName: 'school_urban_rural_locations',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // SchoolUrbanRuralLocation.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'SchoolUrbanRuralLocationRevision', modelKey: 'schoolUrbanRuralLocation' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // SchoolUrbanRuralLocation.addHook('afterUpdate', (instance, options) => {
  //   const hookName = instance.deletedById !== null ? 'afterDestroy' : 'afterUpdate'
  //   createRevisionHook({ revisionModelName: 'SchoolUrbanRuralLocationRevision', modelKey: 'schoolUrbanRuralLocation' })(instance, {
  //     ...options,
  //     hookName
  //   })
  // })

  return SchoolUrbanRuralLocation
}
