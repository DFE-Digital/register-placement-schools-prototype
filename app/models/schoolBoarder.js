const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class SchoolBoarder extends Model {
    static associate(models) {
      SchoolBoarder.hasMany(models.SchoolDetail, {
        foreignKey: 'boarderCode',
        sourceKey: 'code',
        as: 'schoolDetails'
      })

      SchoolBoarder.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      SchoolBoarder.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  SchoolBoarder.init(
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
      modelName: 'SchoolBoarder',
      tableName: 'school_boarders',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // SchoolBoarder.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'SchoolBoarderRevision', modelKey: 'schoolBoarder' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // SchoolBoarder.addHook('afterUpdate', (instance, options) => {
  //   const hookName = instance.deletedById !== null ? 'afterDestroy' : 'afterUpdate'
  //   createRevisionHook({ revisionModelName: 'SchoolBoarderRevision', modelKey: 'schoolBoarder' })(instance, {
  //     ...options,
  //     hookName
  //   })
  // })

  return SchoolBoarder
}
