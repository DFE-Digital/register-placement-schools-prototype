const {
  SchoolType,
  SchoolGroup,
  SchoolStatus,
  SchoolEducationPhase
} = require('../models')


const getSchoolGroupOptions = async () => {
  const items = []

  const schoolGroups = await SchoolGroup.findAll({})

  schoolGroups.forEach((schoolGroup) => {
    const item = {}
    item.text = schoolGroup.name
    item.value = schoolGroup.code
    item.id = schoolGroup.id
    items.push(item)
  })

  return items
}

const getSchoolTypeOptions = async () => {
  const items = []

  const schoolTypes = await SchoolType.findAll({})

  schoolTypes.forEach((schoolType) => {
    const item = {}
    item.text = schoolType.name
    item.value = schoolType.code
    item.id = schoolType.id
    items.push(item)
  })

  return items
}

const getSchoolStatusOptions = async () => {
  const items = []

  const schoolStatuses = await SchoolStatus.findAll({})

  schoolStatuses.forEach((schoolStatus) => {
    const item = {}
    item.text = schoolStatus.name
    item.value = schoolStatus.code
    item.id = schoolStatus.id
    items.push(item)
  })

  return items
}

const getSchoolEducationPhaseOptions = async () => {
  const items = []

  const schoolEducationPhases = await SchoolEducationPhase.findAll({})

  schoolEducationPhases.forEach((schoolEducationPhase) => {
    const item = {}
    item.text = schoolEducationPhase.name
    item.value = schoolEducationPhase.code
    item.id = schoolEducationPhase.id
    items.push(item)
  })

  return items
}

module.exports = {
  getSchoolTypeOptions,
  getSchoolGroupOptions,
  getSchoolStatusOptions,
  getSchoolEducationPhaseOptions
}
