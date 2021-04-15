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
    var {name, phone, locations, template_id, message, sendTemplate} = request.body;
    const {token} = request.query;
    phone = phone.split(',')[0];
    phone = phone.replace(/[^\d\+]/g,"");
    phone = phone.includes('+1') ? phone.split('+1')[1] : phone

    const getArrByPhone = {
        params: {
            token,
            phone
        }
    }

    if(phone.length === 0) {
        response.status(200).send({message: "No phone or email provided. Please check your zap and try again."})
    } else {
        axios.get(process.env.CONTACTS_URL, getArrByPhone, config)
        .then(res => {
            const found = res.data.data.length > 0;
            var contactId = 0;
            if(found) {
               for (var i = 0; i < res.data.data.length; i++){
                   const match = res.data.data[i].locations.some(el => el.id === locations)
                   if (match) {
                       contactId = res.data.data[i].id
                   }

                   if (i === res.data.data.length - 1) {
                       if (contactId > 0) {
                            text.sendText(contactId, template_id , token, message, sendTemplate)
                            .then(res => {
                                response.json(res.data[0])
                            })
                            .catch(err => {
                                console.log(err.response.data)
                                response.status(500).send(err.response.data)
                            })
                       } else {
                            createContact(token, name, phone, locations)
                       }
                   }
               }
            } else {
                createContact(token, name, phone, locations)
            }
        })
        .catch(err => {
            console.log("Error when searching for contact: Phone", err)
            response.status(200).send({message: err.response.data})
        })
    
        function createContact(token, name, phone, locations) {
            const arr = {
                token,
                name,
                phone,
                locations: [locations]
            }
            axios.post(process.env.CONTACTS_URL, arr, config)
            .then(res => {
                const {id} = res.data;
                text.sendText(id, template_id , token, message, sendTemplate)
                .then(res => {
                    response.json(res.data[0])
                })
                .catch(err => {
                    console.log(err.response.data)
                    response.status(500).send(err.response.data)
                })
            })
            .catch(err => {
                return console.log("Error when creating contact", err.response.data)
            })
        }
    }

})

module.exports = router;