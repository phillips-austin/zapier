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
router.post('/send', (request, response) => {
    var {token, phone, name, email, locations, campaign_id, how, date, hour, ampm, minute, tag} = request.body;
    tag = tag.length === 0 ? null : tag;
    email = email.split(',')[0];
    phone = phone.split(',')[0];
    phone = phone.replace(/[^\d\+]/g,"");
    const getArrByPhone = {
        params: {
            token,
            phone
        }
    }
    const getArrByEmail = {
        params: {
            token,
            email
        }
    }

    if(phone.length === 0 && email.length === 0) {
        response.status(200).send({message: "No phone or email provided. Please check your zap and try again."})
    } else {
        axios.get(process.env.CONTACTS_URL, getArrByPhone, config)
        .then(res => {
            const found = res.data.data.length == 1;
            if(found) {
                const {id} = res.data.data[0]
                send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag)
            } else {
                axios.get(process.env.CONTACTS_URL, getArrByEmail, config)
                .then(res => {
                    const foundEmail = res.data.data.length == 1;
                    if(foundEmail) {
                        const {id} = res.data.data[0]
                        send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag)
                    } else {
                        createContact(token, name, phone, email, locations)
                    }
                })
                .catch(err => {
                    return console.log("Error when searching for contact: Email", err)
                })
            }
        })
        .catch(err => {
            return console.log("Error when searching for contact: Phone", err)
        })
    
        function createContact(token, name, phone, email, locations) {
            const arr = {
                token,
                name,
                email,
                phone,
                locations: [locations]
            }
            axios.post(process.env.CONTACTS_URL, arr, config)
            .then(res => {
                const {id} = res.data;
                send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag)
            })
            .catch(err => {
                console.log("Error when creating contact", err.response.data.errors)
                response.status(500).send({message: err.response.data.errors})
            })
        }
    
        function send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag){
            if(how === "Instant") {
                return invite.sendInvite(id, token, locations, campaign_id, tag)
                        .then(res => {
                            response.json(res.invite.message)
                            console.log(res.invite.message)
                        })
                        .catch(err => {
                            response.json(err.response.data.message)
                            console.log("Line: 39")
                        })
            } else {
                return invite.sendInviteScheduled(id, token, locations, campaign_id, how, date, hour, minute, ampm, tag)
                        .then(res => {
                            response.json(res.data)
                            console.log(res.data)
                        })
                        .catch(err => {
                            response.json(err)
                            console.log("Line: 49")
                        })
            }
        }
    }

});

router.get('/update', (req, res, next) => {
    var {token, phone, name, email, locations, campaign_id, how, date, hour, ampm, minute, tag} = req.body;
    const arr = {
        params: {
            token, 
            tag
        }
    }
    axios.get(`${process.env.INVITES_URL}/tag/${tag}`,arr ,config)
    .then(res => {
        console.log(res.data)
    })
    .catch(err => {
        console.log(err)
    })
})

// Delete scheduled invite
router.post('/delete', (req, response, next) => {
    const {token, tag} = req.body;
    const arr = {
        params: {
            token,
            tag_id: tag[0]
        }
    }
    axios.get(`${process.env.INVITES_URL}/tag/${tag[0]}`, arr, config)
    .then(res => {
        const invites = res.data.data;
        var count = 0;
        invites.map(i => {
            const {id} = i;
            const arr = {
                token,
                invite_id: id
            }
            axios.put(`https://platform.swellcx.com/api/v1/invite/${id}/cancel`, arr, config)
            .then(res => {
                count += 1;
                if(count === invites.length) {
                    response.json({message: "Deleted"})
                }
            })
            .catch(err => {
                response.status(200).send({message: "No invitations found"})
            })
        })
    })
    .catch(err => {
        console.log(err)
    })
})

module.exports = router;