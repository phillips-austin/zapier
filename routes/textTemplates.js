const router = require('express').Router();  
const axios = require('axios');

const config = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}

// Get all text templates
router.get('/', (request, response) => {
    const {token} = request.query;
    const url = process.env.TEMPLATES_URL;
    const arr = {
        params: {
            token
        }
    }
    axios.get(url, arr, config)
    .then(res => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(res.data.data));
    })
    .catch(err => {
        console.log(err);
        response.status(500).send({message: err.response.data.message})
    })
})

module.exports = router;