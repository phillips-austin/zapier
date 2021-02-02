const axios = require('axios');

const config = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}

async function getContactId(token, name, phone, email, locations) {
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
    axios.get(process.env.CONTACTS_URL, getArrByPhone, config)
    .then(res => {
        const found = res.data.data.length > 0;
        if(found) {
            return {data: "Testing"}
        } else {
            axios.get(process.env.CONTACTS_URL, getArrByEmail, config)
            .then(res => {
                const foundEmail = res.data.data.length > 0;
                if(foundEmail) {
                    return console.log(res.data)
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

}

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
        return res
    })
    .catch(err => {
        return console.log("Error when creating contact", err)
    })
}

module.exports = {getContactId}