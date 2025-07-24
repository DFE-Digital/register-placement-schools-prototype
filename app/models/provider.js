const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class Provider extends Model {
    static associate(models) {
      Provider.hasMany(models.PlacementSchool, {
        foreignKey: 'providerId',
        as: 'placements'
      })

      Provider.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      Provider.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  Provider.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      operatingName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'operating_name',
        validate: {
          notEmpty: true
        }
      },
      legalName: {
        type: DataTypes.STRING,
        field: 'legal_name'
      },
      typeCode: {
        type: DataTypes.ENUM('hei', 'other', 'school'),
        field: 'type_code'
      },
      ukprn:  {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          is: /^1\d{7}$/
        }
      },
      urn:  {
        type: DataTypes.STRING,
        unique: true
      },
      accreditedProviderNumber:  {
        type: DataTypes.STRING,
        unique: true,
        field: 'accredited_provider_number'
      },
      providerCode:  {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'provider_code',
        validate: {
          notEmpty: true,
          is: /^[a-zA-Z0-9]{3}$/
        }
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
      modelName: 'Provider',
      tableName: 'providers',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // Provider.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'ProviderRevision', modelKey: 'provider' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // Provider.addHook('afterUpdate',
  //   createRevisionHook({ revisionModelName: 'ProviderRevision', modelKey: 'provider' })
  // )

  return Provider
}
