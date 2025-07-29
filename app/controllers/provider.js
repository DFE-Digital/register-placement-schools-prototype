const { Provider } = require('../models')

const { Op } = require('sequelize')

exports.providerSuggestions_json = async (req, res) => {
  req.headers['Access-Control-Allow-Origin'] = true

  const query = req.query.search || ''

  const providers = await Provider.findAll({
    attributes: [
      'id',
      'operatingName',
      'legalName',
      'ukprn',
      'urn'
    ],
    where: {
      deletedAt: null,
      [Op.or]: [
        { operatingName: { [Op.like]: `%${query}%` } },
        { legalName: { [Op.like]: `%${query}%` } },
        { ukprn: { [Op.like]: `%${query}%` } },
        { urn: { [Op.like]: `%${query}%` } }
      ]
    },
    order: [['operatingName', 'ASC']]
  })

  res.json(providers)
}
