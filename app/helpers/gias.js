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


const getSchoolAdmissionsPolicyOptions = async () => {
  const items = []

  const schoolAdmissionsPolicies = await SchoolAdmissionsPolicy.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolAdmissionsPolicies.forEach((schoolAdmissionsPolicy) => {
    const item = {}
    item.text = schoolAdmissionsPolicy.name
    item.value = schoolAdmissionsPolicy.code
    item.id = schoolAdmissionsPolicy.id
    items.push(item)
  })

  return items
}

const getSchoolAdmissionsPolicyLabel = async (code) => {
  let label

  const schoolAdmissionsPolicy = await SchoolAdmissionsPolicy.findOne({ where: {
    code: code
  }})

  if (schoolAdmissionsPolicy) {
    label = schoolAdmissionsPolicy.name
  } else {
    label = code
  }

  return label
}

const getSchoolBoarderOptions = async () => {
  const items = []

  const schoolBoarders = await SchoolBoarder.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolBoarders.forEach((schoolBoarder) => {
    const item = {}
    item.text = schoolBoarder.name
    item.value = schoolBoarder.code
    item.id = schoolBoarder.id
    items.push(item)
  })

  return items
}

const getSchoolBoarderLabel = async (code) => {
  let label

  const schoolBoarder = await SchoolBoarder.findOne({ where: {
    code: code
  }})

  if (schoolBoarder) {
    label = schoolBoarder.name
  } else {
    label = code
  }

  return label
}

const getSchoolEducationPhaseOptions = async () => {
  const items = []

  const schoolEducationPhases = await SchoolEducationPhase.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolEducationPhases.forEach((schoolEducationPhase) => {
    const item = {}
    item.text = schoolEducationPhase.name
    item.value = schoolEducationPhase.code
    item.id = schoolEducationPhase.id
    items.push(item)
  })

  return items
}

const getSchoolEducationPhaseLabel = async (code) => {
  let label

  const schoolEducationPhase = await SchoolEducationPhase.findOne({ where: {
    code: code
  }})

  if (schoolEducationPhase) {
    label = schoolEducationPhase.name
  } else {
    label = code
  }

  return label
}

const getSchoolGenderOptions = async () => {
  const items = []

  const schoolGenders = await SchoolGender.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolGenders.forEach((schoolGender) => {
    const item = {}
    item.text = schoolGender.name
    item.value = schoolGender.code
    item.id = schoolGender.id
    items.push(item)
  })

  return items
}

const getSchoolGenderLabel = async (code) => {
  let label

  const schoolGender = await SchoolGender.findOne({ where: {
    code: code
  }})

  if (schoolGender) {
    label = schoolGender.name
  } else {
    label = code
  }

  return label
}

const getSchoolGroupOptions = async () => {
  const items = []

  const schoolGroups = await SchoolGroup.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolGroups.forEach((schoolGroup) => {
    const item = {}
    item.text = schoolGroup.name
    item.value = schoolGroup.code
    item.id = schoolGroup.id
    items.push(item)
  })

  return items
}

const getSchoolGroupLabel = async (code) => {
  let label

  const schoolGroup = await SchoolGroup.findOne({ where: {
    code: code
  }})

  if (schoolGroup) {
    label = schoolGroup.name
  } else {
    label = code
  }

  return label
}

const getSchoolNurseryProvisionOptions = async () => {
  const items = []

  const schoolNurseryProvisions = await SchoolNurseryProvision.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolNurseryProvisions.forEach((schoolNurseryProvision) => {
    const item = {}
    item.text = schoolNurseryProvision.name
    item.value = schoolNurseryProvision.code
    item.id = schoolNurseryProvision.id
    items.push(item)
  })

  return items
}

const getSchoolNurseryProvisionLabel = async (code) => {
  let label

  const schoolNurseryProvision = await SchoolNurseryProvision.findOne({ where: {
    code: code
  }})

  if (schoolNurseryProvision) {
    label = schoolNurseryProvision.name
  } else {
    label = code
  }

  return label
}

const getSchoolReligiousCharacterOptions = async () => {
  const items = []

  const schoolReligiousCharacters = await SchoolReligiousCharacter.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolReligiousCharacters.forEach((schoolReligiousCharacter) => {
    const item = {}
    item.text = schoolReligiousCharacter.name
    item.value = schoolReligiousCharacter.code
    item.id = schoolReligiousCharacter.id
    items.push(item)
  })

  return items
}

const getSchoolReligiousCharacterLabel = async (code) => {
  let label

  const schoolReligiousCharacter = await SchoolReligiousCharacter.findOne({ where: {
    code: code
  }})

  if (schoolReligiousCharacter) {
    label = schoolReligiousCharacter.name
  } else {
    label = code
  }

  return label
}

const getSchoolSixthFormOptions = async () => {
  const items = []

  const schoolSixthForms = await SchoolSixthForm.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolSixthForms.forEach((schoolSixthForm) => {
    const item = {}
    item.text = schoolSixthForm.name
    item.value = schoolSixthForm.code
    item.id = schoolSixthForm.id
    items.push(item)
  })

  return items
}

const getSchoolSixthFormLabel = async (code) => {
  let label

  const schoolSixthForm = await SchoolSixthForm.findOne({ where: {
    code: code
  }})

  if (schoolSixthForm) {
    label = schoolSixthForm.name
  } else {
    label = code
  }

  return label
}

const getSchoolSpecialClassOptions = async () => {
  const items = []

  const schoolSpecialClasses = await SchoolSpecialClass.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolSpecialClasses.forEach((schoolSpecialClass) => {
    const item = {}
    item.text = schoolSpecialClass.name
    item.value = schoolSpecialClass.code
    item.id = schoolSpecialClass.id
    items.push(item)
  })

  return items
}

const getSchoolSpecialClassLabel = async (code) => {
  let label

  const schoolSpecialClass = await SchoolSpecialClass.findOne({ where: {
    code: code
  }})

  if (schoolSpecialClass) {
    label = schoolSpecialClass.name
  } else {
    label = code
  }

  return label
}

const getSchoolTypeOptions = async () => {
  const items = []

  const schoolTypes = await SchoolType.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolTypes.forEach((schoolType) => {
    const item = {}
    item.text = schoolType.name
    item.value = schoolType.code
    item.id = schoolType.id
    items.push(item)
  })

  return items
}

const getSchoolTypeLabel = async (code) => {
  let label

  const schoolType = await SchoolType.findOne({ where: {
    code: code
  }})

  if (schoolType) {
    label = schoolType.name
  } else {
    label = code
  }

  return label
}

const getSchoolStatusOptions = async () => {
  const items = []

  const schoolStatuses = await SchoolStatus.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolStatuses.forEach((schoolStatus) => {
    const item = {}
    item.text = schoolStatus.name
    item.value = schoolStatus.code
    item.id = schoolStatus.id
    items.push(item)
  })

  return items
}

const getSchoolStatusLabel = async (code) => {
  let label

  const schoolStatus = await SchoolStatus.findOne({ where: {
    code: code
  }})

  if (schoolStatus) {
    label = schoolStatus.name
  } else {
    label = code
  }

  return label
}

const getSchoolUrbanRuralLocationOptions = async () => {
  const items = []

  const schoolUrbanRuralLocations = await SchoolUrbanRuralLocation.findAll({
    order: [
      ['rank', 'ASC'],
      ['name', 'ASC']
    ]
  })

  schoolUrbanRuralLocations.forEach((schoolUrbanRuralLocation) => {
    const item = {}
    item.text = schoolUrbanRuralLocation.name
    item.value = schoolUrbanRuralLocation.code
    item.id = schoolUrbanRuralLocation.id
    items.push(item)
  })

  return items
}

const getSchoolUrbanRuralLocationLabel = async (code) => {
  let label

  const schoolUrbanRuralLocation = await SchoolUrbanRuralLocation.findOne({ where: {
    code: code
  }})

  if (schoolUrbanRuralLocation) {
    label = schoolUrbanRuralLocation.name
  } else {
    label = code
  }

  return label
}

module.exports = {
  getSchoolAdmissionsPolicyLabel,
  getSchoolAdmissionsPolicyOptions,
  getSchoolBoarderLabel,
  getSchoolBoarderOptions,
  getSchoolEducationPhaseLabel,
  getSchoolEducationPhaseOptions,
  getSchoolGenderLabel,
  getSchoolGenderOptions,
  getSchoolGroupLabel,
  getSchoolGroupOptions,
  getSchoolNurseryProvisionLabel,
  getSchoolNurseryProvisionOptions,
  getSchoolReligiousCharacterLabel,
  getSchoolReligiousCharacterOptions,
  getSchoolSixthFormLabel,
  getSchoolSixthFormOptions,
  getSchoolSpecialClassLabel,
  getSchoolSpecialClassOptions,
  getSchoolStatusLabel,
  getSchoolStatusOptions,
  getSchoolTypeLabel,
  getSchoolTypeOptions,
  getSchoolUrbanRuralLocationLabel,
  getSchoolUrbanRuralLocationOptions
}
