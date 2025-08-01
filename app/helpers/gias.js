/**
 * Metadata option and label helper functions for school-related lookup tables.
 *
 * These functions retrieve metadata records (such as school type, status, group, etc.)
 * from the database and return structured arrays suitable for populating GOV.UK
 * checkbox and select components. Each category also includes a label function to
 * convert a code into a human-readable name.
 *
 * All records are sorted by `rank` (tinyint) and then `name` (varchar).
 */

const {
  SchoolAdmissionsPolicy,
  SchoolBoarder,
  SchoolEducationPhase,
  SchoolGender,
  SchoolGroup,
  SchoolNurseryProvision,
  SchoolReligiousCharacter,
  SchoolSixthForm,
  SchoolSpecialClass,
  SchoolStatus,
  SchoolType,
  SchoolUrbanRuralLocation
} = require('../models')

/**
 * Generic function to retrieve ordered lookup options
 */
const getOptions = async (model) => {
  const rows = await model.findAll({
    order: [['rank', 'ASC'], ['name', 'ASC']]
  })
  return rows.map(row => ({
    text: row.name,
    value: row.code,
    id: row.id
  }))
}

/**
 * Generic function to retrieve label for a given code
 */
const getLabel = async (model, code) => {
  const row = await model.findOne({ where: { code } })
  return row ? row.name : code
}

module.exports = {
  getSchoolAdmissionsPolicyOptions: () => getOptions(SchoolAdmissionsPolicy),
  getSchoolAdmissionsPolicyLabel: (code) => getLabel(SchoolAdmissionsPolicy, code),

  getSchoolBoarderOptions: () => getOptions(SchoolBoarder),
  getSchoolBoarderLabel: (code) => getLabel(SchoolBoarder, code),

  getSchoolEducationPhaseOptions: () => getOptions(SchoolEducationPhase),
  getSchoolEducationPhaseLabel: (code) => getLabel(SchoolEducationPhase, code),

  getSchoolGenderOptions: () => getOptions(SchoolGender),
  getSchoolGenderLabel: (code) => getLabel(SchoolGender, code),

  getSchoolGroupOptions: () => getOptions(SchoolGroup),
  getSchoolGroupLabel: (code) => getLabel(SchoolGroup, code),

  getSchoolNurseryProvisionOptions: () => getOptions(SchoolNurseryProvision),
  getSchoolNurseryProvisionLabel: (code) => getLabel(SchoolNurseryProvision, code),

  getSchoolReligiousCharacterOptions: () => getOptions(SchoolReligiousCharacter),
  getSchoolReligiousCharacterLabel: (code) => getLabel(SchoolReligiousCharacter, code),

  getSchoolSixthFormOptions: () => getOptions(SchoolSixthForm),
  getSchoolSixthFormLabel: (code) => getLabel(SchoolSixthForm, code),

  getSchoolSpecialClassOptions: () => getOptions(SchoolSpecialClass),
  getSchoolSpecialClassLabel: (code) => getLabel(SchoolSpecialClass, code),

  getSchoolStatusOptions: () => getOptions(SchoolStatus),
  getSchoolStatusLabel: (code) => getLabel(SchoolStatus, code),

  getSchoolTypeOptions: () => getOptions(SchoolType),
  getSchoolTypeLabel: (code) => getLabel(SchoolType, code),

  getSchoolUrbanRuralLocationOptions: () => getOptions(SchoolUrbanRuralLocation),
  getSchoolUrbanRuralLocationLabel: (code) => getLabel(SchoolUrbanRuralLocation, code)
}
