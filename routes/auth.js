const router = require('express').Router();  
const axios = require('axios');

const config = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}

// Token Auth
router.get('', (request, response) => {
    const {token} = request.query;
    const url = process.env.LOCATIONS_URL
    const arr = {
        params: {
            token
        }
    }
    axios.get(url, arr, config)
    .then(res => {
        const firstLocation = res.data.data[0];
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(firstLocation));
    })
    .catch(err => {
        response.status(500).send({Authenticated: false})
    })

});

module.exports = router;