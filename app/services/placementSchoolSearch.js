const { Op } = require('sequelize')
const {
  PlacementSchool,
  School,
  SchoolAddress,
  SchoolType,
  SchoolGroup,
  SchoolStatus,
  SchoolEducationPhase,
  Provider,
  AcademicYear
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

module.exports = {
  getPlacementSchoolsByLocation
}
