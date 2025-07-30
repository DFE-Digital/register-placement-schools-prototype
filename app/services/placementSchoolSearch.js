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

const toRadians = (deg) => deg * (Math.PI / 180)

const getDistanceInMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8 // miles
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const getPlacementSchoolsByLocation = async (searchLat, searchLng, page = 1, limit = 25, radiusMiles = 20) => {
  const offset = (page - 1) * limit
  const degreeRadius = radiusMiles / 69

  // Step 1: Get IDs of candidate schools within bounding box
  const candidateRows = await PlacementSchool.findAll({
    include: [
      {
        model: School,
        as: 'school',
        include: [
          {
            model: SchoolAddress,
            as: 'schoolAddress',
            where: {
              latitude: { [Op.between]: [searchLat - degreeRadius, searchLat + degreeRadius] },
              longitude: { [Op.between]: [searchLng - degreeRadius, searchLng + degreeRadius] }
            },
            required: true
          }
        ],
        required: true
      }
    ],
    attributes: ['schoolId'],
    raw: true,
    nest: true
  })

  const schoolIds = [...new Set(candidateRows.map(r => r.schoolId))]

  // Step 2: Query placement data for nearby schools
  const placementRows = await PlacementSchool.findAll({
    where: { schoolId: schoolIds },
    include: [
      {
        model: School,
        as: 'school',
        required: true,
        include: [
          {
            model: SchoolAddress,
            as: 'schoolAddress',
            required: true
          },
          { model: SchoolType, as: 'schoolType' },
          { model: SchoolGroup, as: 'schoolGroup' },
          { model: SchoolStatus, as: 'schoolStatus' },
          { model: SchoolEducationPhase, as: 'schoolEducationPhase' }
        ]
      },
      { model: AcademicYear, as: 'academicYear' }
    ]
  })

  // Step 3: Aggregate by school and compute distance
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
          address: s.schoolAddress,
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

  const results = Array.from(schoolMap.values())
    .sort((a, b) => a.distance - b.distance)

  const pagedResults = results.slice(offset, offset + limit)
  const pagination = new Pagination(pagedResults, results.length, page, limit)

  return {
    placements: pagination.getData(),
    pagination
  }
}

const getPlacementSchoolDetails = async (schoolId) => {
  const school = await School.findByPk(schoolId, {
    include: [
      // School address
      { model: SchoolAddress, as: 'schoolAddress' },

      // Look-up models for School
      { model: SchoolType, as: 'schoolType' },
      { model: SchoolGroup, as: 'schoolGroup' },
      { model: SchoolStatus, as: 'schoolStatus' },
      { model: SchoolEducationPhase, as: 'schoolEducationPhase' },

      // School detail with its look-ups
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

  // Get placement relationships
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

  // Group placements by academic year
  const groupedByYear = {}

  placementRelationships.forEach(row => {
    const year = row.academicYear
    const provider = row.provider

    if (!groupedByYear[year.id]) {
      groupedByYear[year.id] = {
        id: year.id,
        name: year.name,
        providers: []
      }
    }

    groupedByYear[year.id].providers.push({
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
}

const getPlacementSchoolsForProvider = async (providerId, page = 1, limit = 25) => {
  const offset = (page - 1) * limit

  // Step 1: Confirm provider exists
  const provider = await Provider.findByPk(providerId)
  if (!provider) return null

  // Step 2: Get total number of placements (used for pagination)
  const totalCount = await PlacementSchool.count({
    where: { providerId }
  })

  if (totalCount === 0) {
    return {
      provider: {
        id: provider.id,
        operatingName: provider.operatingName,
        legalName: provider.legalName,
        ukprn: provider.ukprn,
        urn: provider.urn
      },
      academicYears: [],
      pagination: new Pagination([], 0, page, limit)
    }
  }

  // Step 3: Get flattened list of placement rows (only schoolId + academicYear) for this page
  const pagedPlacementRows = await PlacementSchool.findAll({
    where: { providerId },
    include: [
      {
        model: AcademicYear,
        as: 'academicYear',
        attributes: ['id', 'name']
      },
      {
        model: School,
        as: 'school',
        attributes: ['id', 'name'],
        required: true
      }
    ],
    attributes: ['schoolId', 'academicYearId'],
    order: [
      [{ model: AcademicYear, as: 'academicYear' }, 'name', 'DESC'],
      [{ model: School, as: 'school' }, 'name', 'ASC']
    ],
    offset,
    limit,
    raw: true,
    nest: true
  })

  const schoolIds = pagedPlacementRows.map(row => row.schoolId)

  // Step 4: Fetch full school + academic year info for these schools
  const fullPlacements = await PlacementSchool.findAll({
    where: {
      providerId,
      schoolId: schoolIds
    },
    include: [
      {
        model: AcademicYear,
        as: 'academicYear',
        attributes: ['id', 'name']
      },
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
        ]
      }
    ]
  })

  // Step 5: Flatten for pagination and regroup by academic year
  const pageItems = fullPlacements.map(row => ({
    academicYearId: row.academicYear.id,
    academicYearName: row.academicYear.name,
    school: {
      id: row.school.id,
      name: row.school.name,
      ukprn: row.school.ukprn,
      urn: row.school.urn,
      type: row.school.schoolType?.name || null,
      group: row.school.schoolGroup?.name || null,
      status: row.school.schoolStatus?.name || null,
      educationPhase: row.school.schoolEducationPhase?.name || null,
      address: row.school.schoolAddress || null
    }
  }))

  // Sort again (in case DB order isn't preserved exactly)
  pageItems.sort((a, b) => {
    const yearCompare = b.academicYearName.localeCompare(a.academicYearName)
    return yearCompare !== 0 ? yearCompare : a.school.name.localeCompare(b.school.name)
  })

  const pagination = new Pagination(pageItems, totalCount, page, limit)

  // Step 6: Group paged items by academic year
  const grouped = {}
  for (const item of pageItems) {
    const yearId = item.academicYearId
    if (!grouped[yearId]) {
      grouped[yearId] = {
        id: yearId,
        name: item.academicYearName,
        schools: []
      }
    }
    grouped[yearId].schools.push(item.school)
  }

  const academicYears = Object.values(grouped).sort((a, b) =>
    b.name.localeCompare(a.name)
  )

  return {
    provider: {
      id: provider.id,
      operatingName: provider.operatingName,
      legalName: provider.legalName,
      ukprn: provider.ukprn,
      urn: provider.urn
    },
    academicYears,
    pagination
  }
}

module.exports = {
  getPlacementSchoolDetails,
  getPlacementSchoolsByLocation,
  getPlacementSchoolsForProvider
}
