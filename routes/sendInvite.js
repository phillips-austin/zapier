const router = require('express').Router();  
const axios = require('axios');
const invite = require('../functions/sendInvite');

const config = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}

// Send Invite
router.post('/', (request, response) => {
    var {token, phone, name, email, locations, campaign_id, how, date, hour, ampm, minute} = request.body;
    email = email.split(',')[0];
    phone = phone.split(',')[0];
    phone = phone.replace(/[^\d\+]/g,"");
    const url = process.env.CONTACTS_URL;
    const arr = {
        token,
        name,
        email,
        phone,
        locations: {id: locations}
    }

    console.log(arr)
    // Create Contact
    axios.post(url, arr, config)
    .then(res => {
        if (how === 'Instant') {
            return invite.sendInvite(res.data.id, token, locations, campaign_id)
                    .then(res => {
                        response.json(res.invite.message)
                        console.log(res.invite.message)
                    })
                    .catch(err => {
                        response.json(err.response.data.message)
                        console.log("Line: 39")
                    })
        } else {
            return invite.sendInviteScheduled(res.data.id, token, locations, campaign_id, how, date, hour, minute, ampm, response)
                    .then(res => {
                        response.json(res.data)
                        console.log(res.data)
                    })
                    .catch(err => {
                        response.json(err)
                        console.log("Line: 49")
                    })
        }
    })
    .catch(err => {
        if (err.response.data.errors.email){
            return invite.getContactByEmail(email, token, locations, campaign_id, how, date, hour, minute, ampm, response)
                    .then(res => {
                        if (how === "Instant") {
                            return invite.sendInvite(res.data[0].id, token, locations, campaign_id)
                                    .then(data => {
                                        response.json(data.invite.message)
                                        console.log(res.invite.message)
                                    })
                                    .catch(err => {
                                        response.json(err.response.data.message)
                                        console.log("Line: 65")
                                    })
                        } else {
                            return invite.sendInviteScheduled(res.data[0].id, token, locations, campaign_id, how, date, hour, minute, ampm, response)
                            .then(res => {
                                response.json(res.data)
                                console.log(res.data)
                            })
                            .catch(err => {
                                response.json(err)
                                console.log("Line: 75")
                            })                        }
                    })
                    .catch(err => {
                        console.log(err)
                    })
        } else if (err.response.data.errors.phone) {
            return invite.getContactByPhone(phone, token, locations, campaign_id, how, date, hour, minute, ampm, response)
            .then(res => {
                if (how === "Instant") {
                    return invite.sendInvite(res.data[0].id, token, locations, campaign_id)
                            .then(data => {
                                response.json(data.invite.message)
                                console.log(data.invite.message)
                            })
                            .catch(err => {
                                response.json(err.response.data.message)
                                console.log("Line: 92")
                            })
                } else {
                    return invite.sendInviteScheduled(res.data[0].id, token, locations, campaign_id, how, date, hour, minute, ampm, response)
                    .then(res => {
                        response.json(res.data)
                        console.log(res.data)
                    })
                    .catch(err => {
                        response.json(err)
                        console.log("Line: 102")
                    })                
                }
            })
            .catch(err => {
                console.log(err)
            })
        } else {
            console.log(err);
            response.status(500).send({message: err.response.data.message})
        }
    })
});

module.exports = router;