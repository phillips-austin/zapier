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
    phone = phone.replace(/[^\d\+]/g,"");
    phone = phone.includes('+1') ? phone.split('+1')[1] : phone
    
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

    if(phone.length === 0 && email.length === 0){
        response.status(200).send({message: "No phone or email provided. Please check your zap and try again."})
    } else {
        axios.get(process.env.CONTACTS_URL, getArrByPhone, config)
        .then(res => {
            const found = res.data.data.length == 1;
            if(found) {
                const {id} = res.data.data[0]
                response.status(200).send({message: `Contact with phone number: ${phone} already exists.`})
            } else {
                axios.get(process.env.CONTACTS_URL, getArrByEmail, config)
                .then(res => {
                    const foundEmail = res.data.data.length == 1;
                    if(foundEmail) {
                        const {id} = res.data.data[0]
                        response.status(200).send({message: `Contact with email: ${email} already exists.`})
                    } else {
                        createContact(token, name, phone, email, locations)
                    }
                })
                .catch(err => {
                    response.status(200).send({message: "Error when searching for contact"})
                    console.log("Error when searching for contact: Email", err)
                })
            }
        })
        .catch(err => {
            response.status(200).send({message: "Error when searching for contact"})
            console.log("Error when searching for contact: Phone", err)
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
                response.status(200).send({message: "Contact created with ID: ", id})
            })
            .catch(err => {
                response.status(200).send({message: "Error creating contact"})
                console.log("Error when creating contact")
                console.log(err.response.data.errors)
            })
        }
    }

})

module.exports = router;