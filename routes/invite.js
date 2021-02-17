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
    var {token, phone, name, email, locations, campaign_id, how, date, hour, ampm, minute, tag, override} = request.body;
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
                send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag, override)
                .then(res => {
                    response.json(res)
                })
                .catch(err => {
                    response.status(200).send({message: err})
                })
            } else {
                axios.get(process.env.CONTACTS_URL, getArrByEmail, config)
                .then(res => {
                    const foundEmail = res.data.data.length == 1;
                    if(foundEmail) {
                        const {id} = res.data.data[0]
                        send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag, override)
                        .then(res => {
                            response.json(res)
                        })
                        .catch(err => {
                            response.status(200).send({message: err})
                        })
                    } else {
                        createContact(token, name, phone, email, locations)
                    }
                })
                .catch(err => {
                    console.log("Error when searching for contact: Email", err)
                    response.status(200).send({message: err.response.data})
                })
            }
        })
        .catch(err => {
            console.log("Error when searching for contact: Phone", err)
            response.status(200).send({message: err.response.data})
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
                send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag, override)
                .then(res => {
                    response.json(res)
                })
                .catch(err => {
                    response.status(200).send({message: err})
                })
            })
            .catch(err => {
                console.log("Error when creating contact", err.response.data.errors)
                response.status(200).send({message: err.response.data.errors})
            })
        }
    }

});

function send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag, override){
    if(how === "Instant") {
        return invite.sendInvite(id, token, locations, campaign_id, tag)
                .then(res => {
                    console.log(res.invite.message)
                    return res.invite.message
                })
                .catch(err => {
                    console.log("Line: 39")
                    return err
                })
    } else {
        return invite.sendInviteScheduled(id, token, locations, campaign_id, how, date, hour, minute, ampm, tag, override)
                .then(res => {
                    console.log(res.data)
                    return res.data
                })
                .catch(err => {
                    console.log("Line: 49")
                    return err
                })
    }
}

router.post('/update', (req, response, next) => {
    var {token, how, date, hour, ampm, minute, tag, override, tag_id, tag_name} = req.body;
    tag_name = tag_name.toLowerCase();
    tag = tag.length === 0 ? null : tag;
    const arr = {
        params: {
            token, 
            tag_id
        }
    }
    axios.get(`${process.env.INVITES_URL}/tag/${tag_id}`,arr ,config)
    .then(res => {
        const invites = res.data.data;
        var stoppedCount = 0;
        if(invites.length === 0) {
            response.status(200).send({message: "No invitations with that ID"})
        } else {
            invites.map(i => {
                if(i.status === 'stopped') {
                    stoppedCount += 1;
                    if(stoppedCount === invites.length) {
                        response.status(200).send({message: 'No invitations found.'})
                    }
                } else {
                    var tagsCount = 0;
                    i.tags.map(t => {
                        if(t.name === tag_name) {
                            const filteredInviteId = i.id;
                            const {contact_id, location_id, campaign_id} = i;
                            const deleteConfig = {
                                token, 
                                invite_id: filteredInviteId
                            }
                            axios.put(`https://platform.swellcx.com/api/v1/invite/${filteredInviteId}/cancel`, deleteConfig, config)
                            .then(done => {
                                console.log("Deleted for contact: ", contact_id)
                                send(contact_id, token, location_id, campaign_id, how, date, hour, ampm, minute, tag, override)
                                .then(res => {
                                    response.json(res)
                                })
                                .catch(err => {
                                    response.status(200).send({message: err})
                                })
                            })
                            .catch(err => {
                                console.log(err)
                                response.status(200).send({message: "No invitations found"})
                            })
                        } else {
                            tagsCount += 1;
                            if(tagsCount === i.tags.length) {
                                response.status(200).send({message: "No invitations found"})
                            }
                            console.log("No invite found.")
                        }
                    })
                }
            })
        }
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
            tag_id: tag
        }
    }
    axios.get(`${process.env.INVITES_URL}/tag/${tag}`, arr, config)
    .then(res => {
        const invites = res.data.data;
        var stoppedCount = 0;
        var count = 0;
        if(invites.length === 0) {
            response.status(200).send({message: "No scheduled invitations."})
        } else {
            invites.map(i => {
                if(i.status === 'stopped') {
                    stoppedCount += 1;
                    if(stoppedCount === invites.length) {
                        response.status(200).send({message: "No invitations found."})
                    }
                } else {
                    const {id} = i;
                    const arr = {
                        token,
                        invite_id: id
                    }
                    axios.put(`https://platform.swellcx.com/api/v1/invite/${id}/cancel`, arr, config)
                    .then(res => {
                        count += 1;
                        if(count === invites.length - stoppedCount) {
                            response.json({message: "Deleted"})
                        }
                    })
                    .catch(err => {
                        response.status(200).send({message: "No invitations found"})
                    })
                }
            })
        }
    })
    .catch(err => {
        response.status(200).send({message: "Oops. Something went wrong."})
    })
})

module.exports = router;