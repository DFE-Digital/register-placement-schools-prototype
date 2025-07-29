exports.locationSuggestions_json = async (req, res) => {
    req.headers['Access-Control-Allow-Origin'] = true

    const query = req.query.search || ''

    const locations = []

    res.json(locations)
}
