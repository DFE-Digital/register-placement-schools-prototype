const { Model, DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  class SchoolDetail extends Model {
    static associate(models) {
      SchoolDetail.belongsTo(models.School, {
        foreignKey: 'schoolId',
        as: 'school'
      })

      SchoolDetail.belongsTo(models.SchoolAdmissionsPolicy, {
        foreignKey: 'admissionsPolicyCode',
        targetKey: 'code',
        as: 'admissionsPolicy'
      })

      SchoolDetail.belongsTo(models.SchoolBoarder, {
        foreignKey: 'boarderCode',
        targetKey: 'code',
        as: 'boarder'
      })

      SchoolDetail.belongsTo(models.SchoolGender, {
        foreignKey: 'genderCode',
        targetKey: 'code',
        as: 'gender'
      })

      SchoolDetail.belongsTo(models.SchoolNurseryProvision, {
        foreignKey: 'nurseryProvisionCode',
        targetKey: 'code',
        as: 'nurseryProvision'
      })

      SchoolDetail.belongsTo(models.SchoolReligiousCharacter, {
        foreignKey: 'religiousCharacterCode',
        targetKey: 'code',
        as: 'religiousCharacter'
      })

      SchoolDetail.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdByUser'
      })

      SchoolDetail.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedByUser'
      })
    }
  }

  SchoolDetail.init(
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
      establishmentNumber:  {
        type: DataTypes.STRING,
        field: 'establishment_number'
      },
      localAuthorityCode:  {
        type: DataTypes.STRING,
        field: 'local_authority_code'
      },
      statutoryLowAge:  {
        type: DataTypes.INTEGER,
        field: 'statutory_low_age'
      },
      statutoryHighAge:  {
        type: DataTypes.INTEGER,
        field: 'statutory_high_age'
      },
      boarderCode:  {
        type: DataTypes.STRING,
        field: 'boarder_code'
      },
      nurseryProvisionCode:  {
        type: DataTypes.STRING,
        field: 'nursery_provision_code'
      },
      officialSixthFormCode:  {
        type: DataTypes.STRING,
        field: 'official_sixth_form_code'
      },
      genderCode:  {
        type: DataTypes.STRING,
        field: 'gender_code'
      },
      religiousCharacterCode:  {
        type: DataTypes.STRING,
        field: 'religious_character_code'
      },
      admissionsPolicyCode:  {
        type: DataTypes.STRING,
        field: 'admissions_policy_code'
      },
      specialClassesCode:  {
        type: DataTypes.STRING,
        field: 'special_classes_code'
      },
      schoolCapacity:  {
        type: DataTypes.INTEGER,
        field: 'school_capacity'
      },
      numberOfBoys:  {
        type: DataTypes.INTEGER,
        field: 'number_of_boys'
      },
      numberOfGirls:  {
        type: DataTypes.INTEGER,
        field: 'number_of_girls'
      },
      percentageFreeSchoolMeals:  {
        type: DataTypes.DECIMAL,
        field: 'percentage_free_school_meals'
      },
      districtAdministrativeCode:  {
        type: DataTypes.STRING,
        field: 'district_administrative_code'
      },
      administrativeWardCode:  {
        type: DataTypes.STRING,
        field: 'administrative_ward_code'
      },
      parliamentaryConstituencyCode:  {
        type: DataTypes.STRING,
        field: 'parliamentary_constituency_code'
      },
      urbanRuralCode:  {
        type: DataTypes.STRING,
        field: 'urban_rural_code'
      },
      gssLocalAuthorityCode:  {
        type: DataTypes.STRING,
        field: 'gss_local_authority_code'
      },
      msoaCode:  {
        type: DataTypes.STRING,
        field: 'msoa_code'
      },
      lsoaCode:  {
        type: DataTypes.STRING,
        field: 'lsoa_code'
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
      modelName: 'SchoolDetail',
      tableName: 'school_details',
      timestamps: true
    }
  )

  // const createRevisionHook = require('../hooks/revisionHook')

  // SchoolDetail.addHook('afterCreate', (instance, options) =>
  //   createRevisionHook({ revisionModelName: 'SchoolDetailRevision', modelKey: 'schoolDetail' })(instance, {
  //     ...options,
  //     hookName: 'afterCreate'
  //   })
  // )

  // SchoolDetail.addHook('afterUpdate', (instance, options) => {
  //   const hookName = instance.deletedById !== null ? 'afterDestroy' : 'afterUpdate'
  //   createRevisionHook({ revisionModelName: 'SchoolDetailRevision', modelKey: 'schoolDetail' })(instance, {
  //     ...options,
  //     hookName
  //   })
  // })

  return SchoolDetail
}
