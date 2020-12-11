const router = require('express').Router();  
const axios = require('axios');

const config = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}

// Create Contact Action
router.post('/', (request, response) => {
    var {name, phone, email, locations} = request.body;
    const {token} = request.query;
    email = email.split(',')[0];
    phone = phone.split(',')[0];
    const url = process.env.CONTACTS_URL;
    const arr = {
        token,
        name,
        email,
        phone,
        locations: {id: locations}
    }
    axios.post(url, arr, config)
    .then(res => {
        response.status(200).send(res.data)
    })
    .catch(err => {
        if (err.response.data.errors.phone) response.status(200).send({message: `Contact with phone number: ${phone} already exists.`});
        else if (err.response.data.errors.email) response.status(200).send({message: `Contact with email: ${email} already exists.`});
        else response.status(500).send(err.response.data);
    })
})

module.exports = router;