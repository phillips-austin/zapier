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
    email = email === '' ? null : email
    phone = phone.split(',')[0];
    phone = phone.replace(/[^\d\+]/g,"");
    phone = phone.includes('+1') ? phone.split('+1')[1] : phone
    phone = phone === '' ? null : phone
    minute = (minute < 10 ?  '0' + minute : minute)

    if(phone === null && email === null) {
        response.status(200).send({message: "No phone or email provided. Please check your zap and try again."})
    } else {
        getContact(phone, email, locations, token)
        .then(res => {
            const contactId = res.id;
            if (contactId > 0) {
                handleChecks(contactId, token, campaign_id, tag)
                .then(res => {
                    if(res === true) {
                        response.json({message: "This contact alredy has a scheduled invitation with matching tags and campaign id."})
                    } else {
                        send(contactId, token, locations, campaign_id, how, date, hour, ampm, minute, tag, override)
                        .then(res => {
                            response.json(res)
                        })
                        .catch( err => {
                            response.status(500).send(err)
                            console.log(err)
                        })
                    }
                })
                .catch(err => {
                    response.status(500).send(err)
                    console.log(err)
                })
            } else {
                createContact(token, name, phone, email, locations, response)
            }
        })
        .catch(err => {
            console.log(err)
        })
    }
});

async function getContact(phone, email, locations, token) {
    const arrByPhone = {
        params: {
            token,
            phone,
            location_id: locations
        }
    }

    const arrByEmail = {
        params: {
            token,
            email,
            location_id: locations
        }
    }
    const contactByEmail = await axios.get(process.env.CONTACTS_URL, arrByEmail, config)
    const contactByPhone = await axios.get(process.env.CONTACTS_URL, arrByPhone, config)
    const phoneFound = phone === null ? false : contactByPhone.data.data.length > 0
    const emailFound = email === null ? false : contactByEmail.data.data.length > 0

    if (phoneFound === false && emailFound === false) {
        return {id: 0}
    } else if (phoneFound === false && emailFound === true) {
        return {id: contactByEmail.data.data[0].id}
    } else if (phoneFound === true && emailFound === false) {
        return {id: contactByPhone.data.data[0].id}
    } else if (phoneFound === true && emailFound === true) {
        return {id: contactByPhone.data.data[0].id}
    }
}

function createContact(token, name, phone, email, locations, response) {
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
        handleChecks(id, token, campaign_id, tag)
        .then(res => {
            if(res === true) {
                response.json({message: "This contact alredy has a scheduled invitation with matching tags and campaign id."})
            } else {
                send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag, override)
                .then(res => {
                    response.json(res)
                })
                .catch( err => {
                    response.status(500).send(err)
                })
            }
        })
        .catch(err => {
            console.log(err)
            response.status(500).send(err)
        })
    })
    .catch(err => {
        console.log("Error when creating contact", err.response.data.errors)
        response.status(500).send({message: err.response.data.errors})
    })
}

async function handleChecks(id, token, campaign_id, tag) {
    const campaigns = await checkForExistingCampaign(id, token, campaign_id, tag)
    return campaigns
}

async function checkForExistingCampaign(id, token, campaign_id, tag) {
    const arr = {
        params: {
            token,
            contact_id: id
        }
    }
    const data = await axios.get(`${process.env.CONTACTS_URL}/${id}/invites`, arr, config)
    .then(res => {
        const invites = res.data.data;
        var matchedCampaignTags = [];
        for (var i = 0; i < invites.length; i++) {
            if (invites[i].campaign_id === campaign_id && invites[i].status === 'scheduled') {
                matchedCampaignTags.push(invites[i])
            }
            if (i === invites.length - 1) {
                if (matchedCampaignTags.length > 0) {
                    const checkForTags = checkIfTagsMatch(matchedCampaignTags, tag)
                    return checkForTags
                } else {
                    return false
                }
            }
        }
    })
    .catch(err => {
        console.log(err)
        return err
    })

    return data
}

async function checkIfTagsMatch(invites, tag) {
    if(tag) {
        var matches = [];
        for (var i = 0; i < invites.length; i++) {
            var tagMatch = 0;
            for (var t = 0; t < invites[i].tags.length; t++) {
                if (tag.includes(invites[i].tags[t].name)) {
                    tagMatch += 1
                }

                if(t === invites[i].tags.length - 1) {
                    if (tagMatch === tag.length && tagMatch === invites[i].tags.length) {
                        matches.push(invites[i])
                    }
                }
            }

            if(i === invites.length - 1) {
                if (matches.length > 0) {
                    return true
                } else {
                    return false
                }
            }
        }
    } else {
        return false
    }
}

function send(id, token, locations, campaign_id, how, date, hour, ampm, minute, tag, override){
    if(how === "Instant") {
        return invite.sendInvite(id, token, locations, campaign_id, tag)
                .then(res => {
                    console.log(res.invite.message)
                    return res.invite.message
                })
                .catch(err => {
                    console.log(err.response.data)
                    return err
                })
    } else {
        return invite.sendInviteScheduled(id, token, locations, campaign_id, how, date, hour, minute, ampm, tag, override)
                .then(res => {
                    console.log(res.data)
                    return res.data
                })
                .catch(err => {
                    console.log(err)
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
                                    response.status(500).send({message: err})
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
        response.status(500).send({message: "Oops. Something went wrong."})
    })
})

module.exports = router;