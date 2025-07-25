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

module.exports = {
  getSchoolTypeOptions,
  getSchoolTypeLabel,
  getSchoolGroupOptions,
  getSchoolGroupLabel,
  getSchoolStatusOptions,
  getSchoolStatusLabel,
  getSchoolEducationPhaseOptions,
  getSchoolEducationPhaseLabel
}
