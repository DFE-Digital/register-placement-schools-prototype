const { Op } = require('sequelize')
const {
  AcademicYear,
  PlacementSchool,
  Provider,
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
  SchoolType
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
 * @param {number} [radiusMiles=20] - Radius in miles
 * @returns {Promise<{ placements: any[], pagination: Pagination }>}
 */
const getPlacementSchoolsByLocation = async (searchLat, searchLng, page = 1, limit = 25, radiusMiles = 20) => {
  try {
    const offset = (page - 1) * limit
    const degreeRadius = radiusMiles / 69

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

    const placementRows = await PlacementSchool.findAll({
      where: { schoolId: schoolIds },
      include: [
        {
          model: School,
          as: 'school',
          required: true,
          include: [
            { model: SchoolAddress, as: 'schoolAddress', required: true },
            { model: SchoolType, as: 'schoolType' },
            { model: SchoolGroup, as: 'schoolGroup' },
            { model: SchoolStatus, as: 'schoolStatus' },
            { model: SchoolEducationPhase, as: 'schoolEducationPhase' }
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
      if (distance > radiusMiles) continue

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
            educationPhase: s.schoolEducationPhase?.name || null
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
        religiousCharacter: school.schoolDetail?.religiousCharacter?.name || null
      },
      academicYears
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
 * @returns {Promise<Object|null>}
 */
const getPlacementSchoolsForProvider = async (providerId, page = 1, limit = 25) => {
  try {
    const offset = (page - 1) * limit
    const provider = await Provider.findByPk(providerId)
    if (!provider) return null

    const allPlacements = await PlacementSchool.findAll({
      where: { providerId },
      include: [
        { model: AcademicYear, as: 'academicYear', attributes: ['name'] },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'ukprn', 'urn'],
          include: [
            { model: SchoolAddress, as: 'schoolAddress' },
            { model: SchoolType, as: 'schoolType' },
            { model: SchoolGroup, as: 'schoolGroup' },
            { model: SchoolStatus, as: 'schoolStatus' },
            { model: SchoolEducationPhase, as: 'schoolEducationPhase' }
          ],
          required: true
        }
      ]
    })

    const schoolMap = new Map()

    for (const placement of allPlacements) {
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
            educationPhase: s.schoolEducationPhase?.name || null
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
