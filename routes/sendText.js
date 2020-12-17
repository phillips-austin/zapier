const router = require('express').Router();  
const text = require('../functions/sendText');
const contact = require('../functions/sendInvite');
const axios = require('axios');

const config = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}

// Create Contact Action
router.post('/', (request, response) => {
    var {name, phone, locations, template_id} = request.body;
    const {token} = request.query;
    phone = phone.split(',')[0];
    phone = phone.replace(/[^\d\+]/g,"");
    const url = process.env.CONTACTS_URL;
    const arr = {
        token,
        name,
        phone,
        locations: {id: locations}
    }
    axios.post(url, arr, config)
    .then(res => {
        const {id} = res.data;
        text.sendText(id, template_id , token)
        .then(res => {
            response.json(res.data[0])
        })
        .catch(err => {
            console.log(err.response.data)
            response.status(500).send(err.response.data)
        })
    })
    .catch(err => {
        if (err.response.data.errors.phone) {
            contact.getContactByPhone(phone, token)
            .then(res => {
                const {id} = res.data[0]
                text.sendText(id, template_id , token)
                .then(res => {
                    response.json(res.data[0])
                })
                .catch(err => {
                    console.log(err.response.data)
                    response.status(500).send(err.response.data)
                })
            })
            .catch(err => {
                console.log(err)
                response.status(500).send(err.response.data)
            })
        }
        else response.status(500).send(err.response.data);
    })
})

module.exports = router;