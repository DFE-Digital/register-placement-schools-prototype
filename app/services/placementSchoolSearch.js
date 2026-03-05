const { Op } = require('sequelize')
const {
  AcademicYear,
  PlacementSchool,
  Provider,
  Region,
  School,
  SchoolAddress,
  SchoolAdmissionsPolicy,
  SchoolBoarder,
  SchoolDetail,
  SchoolEducationPhase,
  SchoolGender,
  SchoolGroup,
  SchoolNurseryProvision,
  SchoolReligiousCharacter,
  SchoolStatus,
  SchoolType,
  SchoolRelationship,
  SchoolRelationshipType,
  SchoolRelationshipTypeGroup
} = require('../models')

const Pagination = require('../helpers/pagination')

// Internal utilities
const toRadians = (deg) => deg * (Math.PI / 180)

const getDistanceInMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Fetch placement schools near a location, filtered by radius, and grouped by school.
 *
 * @param {number} searchLat - Latitude of the location
 * @param {number} searchLng - Longitude of the location
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=25] - Results per page
 * @param {number} [selectedRadius=10] - Radius in miles
 * @param {number} [selectedSchoolType=null] - School type code
 * @param {number} [selectedSchoolGroup=null] - School group code
 * @param {number} [selectedSchoolStatus=null] - School status code
 * @param {number} [selectedSchoolEducationPhase=null] - School education phase code
 * @param {string[]|null} [selectedAcademicYear=null] - Academic year code(s)
 * @param {string} [keywords=null] - Keyword search
 * @returns {Promise<{ placements: any[], pagination: Pagination }>}
 */
const getPlacementSchoolsByLocation = async (
  searchLat,
  searchLng,
  page = 1,
  limit = 25,
  selectedRadius = 10,
  selectedSchoolType = null,
  selectedSchoolGroup = null,
  selectedSchoolStatus = null,
  selectedSchoolEducationPhase = null,
  selectedAcademicYear = null,
  keywords=null
) => {
  try {
    const offset = (page - 1) * limit
    const degreeRadius = selectedRadius / 69

    const candidateRows = await PlacementSchool.findAll({
      include: [{
        model: School,
        as: 'school',
        include: [{
          model: SchoolAddress,
          as: 'schoolAddress',
          where: {
            latitude: { [Op.between]: [searchLat - degreeRadius, searchLat + degreeRadius] },
            longitude: { [Op.between]: [searchLng - degreeRadius, searchLng + degreeRadius] }
          },
          required: true
        }],
        required: true
      }],
      attributes: ['schoolId'],
      raw: true,
      nest: true
    })

    const schoolIds = [...new Set(candidateRows.map(r => r.schoolId))]
    if (!schoolIds.length) {
      const pagination = new Pagination([], 0, page, limit)
      return { placements: pagination.getData(), pagination }
    }

    let filteredSchoolIds = schoolIds

    if (selectedAcademicYear?.length) {
      const matchingRows = await PlacementSchool.findAll({
        where: { schoolId: schoolIds },
        include: [{
          model: AcademicYear,
          as: 'academicYear',
          where: { code: { [Op.in]: selectedAcademicYear } },
          required: true
        }],
        attributes: ['schoolId'],
        raw: true
      })

      filteredSchoolIds = [...new Set(matchingRows.map(row => row.schoolId))]
      if (!filteredSchoolIds.length) {
        const pagination = new Pagination([], 0, page, limit)
        return { placements: pagination.getData(), pagination }
      }
    }

    const whereSchool = {}

    if (selectedSchoolType?.length) {
      whereSchool.typeCode = { [Op.in]: selectedSchoolType }
    }
    if (selectedSchoolGroup?.length) {
      whereSchool.groupCode = { [Op.in]: selectedSchoolGroup }
    }
    if (selectedSchoolStatus?.length) {
      whereSchool.statusCode = { [Op.in]: selectedSchoolStatus }
    }
    if (selectedSchoolEducationPhase?.length) {
      whereSchool.educationPhaseCode = { [Op.in]: selectedSchoolEducationPhase }
    }
    if (keywords && keywords.trim() !== '') {
      const term = `%${keywords.trim()}%`
      whereSchool[Op.or] = [
        { name: { [Op.like]: term } },
        { ukprn: { [Op.like]: term } },
        { urn: { [Op.like]: term } }
      ]
    }

    const placementRows = await PlacementSchool.findAll({
      where: { schoolId: filteredSchoolIds },
      include: [
        {
          model: School,
          as: 'school',
          required: true,
          where: whereSchool,
          include: [
            { model: SchoolAddress, as: 'schoolAddress', required: true },
            { model: SchoolType, as: 'schoolType' },
            { model: SchoolGroup, as: 'schoolGroup' },
            { model: SchoolStatus, as: 'schoolStatus' },
            { model: SchoolEducationPhase, as: 'schoolEducationPhase' },
            { model: SchoolDetail, as: 'schoolDetail' }
          ]
        },
        { model: AcademicYear, as: 'academicYear' }
      ]
    })

    const schoolMap = new Map()

    for (const p of placementRows) {
      const s = p.school
      const a = s.schoolAddress
      if (!a || a.latitude == null || a.longitude == null) continue

      const distance = getDistanceInMiles(searchLat, searchLng, a.latitude, a.longitude)
      if (distance > selectedRadius) continue

      const key = s.id
      if (!schoolMap.has(key)) {
        schoolMap.set(key, {
          school: {
            id: s.id,
            name: s.name,
            ukprn: s.ukprn,
            urn: s.urn,
            address: a,
            type: s.schoolType?.name || null,
            group: s.schoolGroup?.name || null,
            status: s.schoolStatus?.name || null,
            educationPhase: s.schoolEducationPhase?.name || null,
            statutoryLowAge: s.schoolDetail ? s.schoolDetail.statutoryLowAge : null,
            statutoryHighAge: s.schoolDetail ? s.schoolDetail.statutoryHighAge : null
          },
          distance,
          academicYears: [p.academicYear.name]
        })
      } else {
        const existing = schoolMap.get(key)
        if (!existing.academicYears.includes(p.academicYear.name)) {
          existing.academicYears.push(p.academicYear.name)
        }
      }
    }

    const results = Array.from(schoolMap.values()).sort((a, b) => a.distance - b.distance)
    const pagedResults = results.slice(offset, offset + limit)
    const pagination = new Pagination(pagedResults, results.length, page, limit)

    return {
      placements: pagination.getData(),
      pagination
    }
  } catch (error) {
    console.error('Error in getPlacementSchoolsByLocation:', error)
    throw error
  }
}

/**
 * Get a placement school’s full details, including academic year groupings.
 *
 * @param {string} schoolId - UUID of the school
 * @returns {Promise<Object|null>}
 */
const getPlacementSchoolDetails = async (schoolId) => {
  try {
    const school = await School.findByPk(schoolId, {
      include: [
        { model: SchoolAddress, as: 'schoolAddress' },
        { model: SchoolType, as: 'schoolType' },
        { model: SchoolGroup, as: 'schoolGroup' },
        { model: SchoolStatus, as: 'schoolStatus' },
        { model: SchoolEducationPhase, as: 'schoolEducationPhase' },
        {
          model: SchoolDetail,
          as: 'schoolDetail',
          include: [
            { model: SchoolAdmissionsPolicy, as: 'admissionsPolicy' },
            { model: SchoolBoarder, as: 'boarder' },
            { model: SchoolGender, as: 'gender' },
            { model: SchoolNurseryProvision, as: 'nurseryProvision' },
            { model: SchoolReligiousCharacter, as: 'religiousCharacter' }
          ]
        }
      ]
    })

    if (!school) return null

    const placementRelationships = await PlacementSchool.findAll({
      where: { schoolId: school.id },
      include: [
        { model: AcademicYear, as: 'academicYear' },
        { model: Provider, as: 'provider' }
      ],
      order: [
        [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
        [{ model: Provider, as: 'provider' }, 'operatingName', 'ASC']
      ]
    })

    const groupedByYear = {}

    placementRelationships.forEach(({ academicYear, provider }) => {
      if (!groupedByYear[academicYear.id]) {
        groupedByYear[academicYear.id] = {
          id: academicYear.id,
          name: academicYear.name,
          providers: []
        }
      }
      groupedByYear[academicYear.id].providers.push({
        id: provider.id,
        name: provider.operatingName,
        ukprn: provider.ukprn,
        urn: provider.urn,
        type: provider.type
      })
    })

    const academicYears = Object.values(groupedByYear).sort((a, b) => b.name.localeCompare(a.name))

    const schoolRelationships = await SchoolRelationship.findAll({
      where: {
        [Op.or]: [
          { schoolId: school.id },
          { relatedSchoolId: school.id }
        ]
      },
      include: [
        { model: School, as: 'school', attributes: ['id', 'name'] },
        { model: School, as: 'relatedSchool', attributes: ['id', 'name'] },
        {
          model: SchoolRelationshipType,
          as: 'relationshipType',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              model: SchoolRelationshipTypeGroup,
              as: 'relationshipTypeGroup',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    })

    const relationshipGroupLabels = {
      Successor: 'is the successor to',
      Predecessor: 'is the predecessor to',
      Other: 'is related to'
    }
    const orderedGroupNames = ['Successor', 'Predecessor', 'Other']
    const relatedSchoolGroupsMap = new Map()

    const invertGroupName = (groupName) => {
      if (groupName === 'Successor') return 'Predecessor'
      if (groupName === 'Predecessor') return 'Successor'
      return groupName
    }

    schoolRelationships.forEach((relationship) => {
      const relatedSchool = relationship.schoolId === school.id
        ? relationship.relatedSchool
        : relationship.relatedSchoolId === school.id
          ? relationship.school
          : null

      if (relatedSchool?.id && relatedSchool.id !== school.id) {
        const relationshipType = relationship.relationshipType
        const baseGroupName = relationshipType?.relationshipTypeGroup?.name || 'Other'
        const relationshipTypeGroupName = relationship.schoolId === school.id
          ? invertGroupName(baseGroupName)
          : baseGroupName

        if (!relatedSchoolGroupsMap.has(relationshipTypeGroupName)) {
          relatedSchoolGroupsMap.set(relationshipTypeGroupName, {
            name: relationshipTypeGroupName,
            label: relationshipGroupLabels[relationshipTypeGroupName] || 'is related to',
            schools: new Map()
          })
        }

        relatedSchoolGroupsMap
          .get(relationshipTypeGroupName)
          .schools
          .set(relatedSchool.id, {
            id: relatedSchool.id,
            name: relatedSchool.name
          })
      }
    })

    const orderedGroups = []
    orderedGroupNames.forEach((groupName) => {
      const group = relatedSchoolGroupsMap.get(groupName)
      if (group) orderedGroups.push(group)
    })

    const remainingGroups = Array.from(relatedSchoolGroupsMap.values())
      .filter((group) => !orderedGroupNames.includes(group.name))
      .sort((a, b) => a.name.localeCompare(b.name))

    const relatedSchoolGroups = [...orderedGroups, ...remainingGroups]
      .map((group) => ({
        name: group.name,
        label: group.label,
        schools: Array.from(group.schools.values())
          .sort((a, b) => a.name.localeCompare(b.name))
      }))

    return {
      id: school.id,
      name: school.name,
      ukprn: school.ukprn,
      urn: school.urn,
      type: school.schoolType?.name || null,
      group: school.schoolGroup?.name || null,
      status: school.schoolStatus?.name || null,
      educationPhase: school.schoolEducationPhase?.name || null,
      address: school.schoolAddress || null,
      detail: {
        ...school.schoolDetail?.toJSON(),
        admissionsPolicy: school.schoolDetail?.admissionsPolicy?.name || null,
        boarder: school.schoolDetail?.boarder?.name || null,
        gender: school.schoolDetail?.gender?.name || null,
        nurseryProvision: school.schoolDetail?.nurseryProvision?.name || null,
        religiousCharacter: school.schoolDetail?.religiousCharacter?.name || null,
        statutoryLowAge: school.schoolDetail?.statutoryLowAge || null,
        statutoryHighAge: school.schoolDetail?.statutoryHighAge || null
      },
      academicYears,
      relatedSchoolGroups
    }
  } catch (error) {
    console.error('Error in getPlacementSchoolDetails:', error)
    throw error
  }
}

/**
 * Fetch all placement schools a provider has worked with, grouped by school.
 * Each school includes the academic years during which it had placements.
 *
 * @param {string} providerId - UUID of the provider
 * @param {number} [page=1] - Page number
 * @param {number} [limit=25] - Results per page
 * @param {number} [selectedRegion=null] - UK region code
 * @param {number} [selectedSchoolType=null] - School type code
 * @param {number} [selectedSchoolGroup=null] - School group code
 * @param {number} [selectedSchoolStatus=null] - School status code
 * @param {number} [selectedSchoolEducationPhase=null] - School education phase code
 * @param {string[]|null} [selectedAcademicYear=null] - Academic year code(s)
 * @param {string} [keywords=null] - Keyword search
 * @returns {Promise<Object|null>}
 */
const getPlacementSchoolsForProvider = async (
  providerId,
  page = 1,
  limit = 25,
  selectedRegion = null,
  selectedSchoolType = null,
  selectedSchoolGroup = null,
  selectedSchoolStatus = null,
  selectedSchoolEducationPhase = null,
  selectedAcademicYear = null,
  keywords = null
) => {
  try {
    const offset = (page - 1) * limit
    const provider = await Provider.findByPk(providerId)
    if (!provider) return null

    const whereSchool = {}

    if (selectedSchoolType?.length) {
      whereSchool.typeCode = { [Op.in]: selectedSchoolType }
    }
    if (selectedSchoolGroup?.length) {
      whereSchool.groupCode = { [Op.in]: selectedSchoolGroup }
    }
    if (selectedSchoolStatus?.length) {
      whereSchool.statusCode = { [Op.in]: selectedSchoolStatus }
    }
    if (selectedSchoolEducationPhase?.length) {
      whereSchool.educationPhaseCode = { [Op.in]: selectedSchoolEducationPhase }
    }
    if (keywords && keywords.trim() !== '') {
      const term = `%${keywords.trim()}%`
      whereSchool[Op.or] = [
        { name: { [Op.like]: term } },
        { ukprn: { [Op.like]: term } },
        { urn: { [Op.like]: term } }
      ]
    }

    const whereSchoolDetail = {}

    if (selectedRegion?.length) {
      whereSchoolDetail.regionCode = { [Op.in]: selectedRegion }
    }

    let filteredSchoolIds = null

    if (selectedAcademicYear?.length) {
      const matchingRows = await PlacementSchool.findAll({
        where: { providerId },
        include: [{
          model: AcademicYear,
          as: 'academicYear',
          where: { code: { [Op.in]: selectedAcademicYear } },
          required: true
        }],
        attributes: ['schoolId'],
        raw: true
      })

      filteredSchoolIds = [...new Set(matchingRows.map(row => row.schoolId))]
      if (!filteredSchoolIds.length) {
        const pagination = new Pagination([], 0, page, limit)
        return {
          provider: {
            id: provider.id,
            operatingName: provider.operatingName,
            legalName: provider.legalName,
            ukprn: provider.ukprn,
            urn: provider.urn
          },
          placements: pagination.getData(),
          pagination
        }
      }
    }

    const placementRows = await PlacementSchool.findAll({
      where: {
        providerId,
        ...(filteredSchoolIds ? { schoolId: { [Op.in]: filteredSchoolIds } } : {})
      },
      include: [
        { model: AcademicYear, as: 'academicYear', attributes: ['name'] },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'ukprn', 'urn'],
          where: whereSchool,
          include: [
            { model: SchoolAddress, as: 'schoolAddress' },
            { model: SchoolType, as: 'schoolType' },
            { model: SchoolGroup, as: 'schoolGroup' },
            { model: SchoolStatus, as: 'schoolStatus' },
            { model: SchoolEducationPhase, as: 'schoolEducationPhase' },
            {
              model: SchoolDetail,
              as: 'schoolDetail',
              attributes: ['regionCode', 'statutoryLowAge', 'statutoryHighAge'],
              where: whereSchoolDetail,
              include: [
                { model: Region, as: 'region', attributes: ['name'] }
              ]
            }
          ],
          required: true
        }
      ]
    })

    const schoolMap = new Map()

    for (const placement of placementRows) {
      const s = placement.school
      if (!schoolMap.has(s.id)) {
        schoolMap.set(s.id, {
          school: {
            id: s.id,
            name: s.name,
            ukprn: s.ukprn,
            urn: s.urn,
            address: s.schoolAddress || null,
            type: s.schoolType?.name || null,
            group: s.schoolGroup?.name || null,
            status: s.schoolStatus?.name || null,
            educationPhase: s.schoolEducationPhase?.name || null,
            statutoryLowAge: s.schoolDetail.statutoryLowAge || null,
            statutoryHighAge: s.schoolDetail.statutoryHighAge || null,
            region: s.schoolDetail?.region?.name || null
          },
          academicYears: [placement.academicYear.name]
        })
      } else {
        const existing = schoolMap.get(s.id)
        if (!existing.academicYears.includes(placement.academicYear.name)) {
          existing.academicYears.push(placement.academicYear.name)
        }
      }
    }

    const allSchools = Array.from(schoolMap.values()).sort((a, b) =>
      a.school.name.localeCompare(b.school.name)
    )

    const pagedSchools = allSchools.slice(offset, offset + limit)
    const pagination = new Pagination(pagedSchools, allSchools.length, page, limit)

    return {
      provider: {
        id: provider.id,
        operatingName: provider.operatingName,
        legalName: provider.legalName,
        ukprn: provider.ukprn,
        urn: provider.urn
      },
      placements: pagination.getData(),
      pagination
    }
  } catch (error) {
    console.error('Error in getPlacementSchoolsForProvider:', error)
    throw error
  }
}

module.exports = {
  getPlacementSchoolDetails,
  getPlacementSchoolsByLocation,
  getPlacementSchoolsForProvider
}
