const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const moment = require('moment');
require('dotenv').config();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(cors());
app.use((err, req, res, next) => {
    res.json(err);
});

const config = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
}
// Postman testing
app.get('/api/test', (req, res) => {
    const datetime = new Date();
    const mst = moment.parseZone(datetime).utc(-7).format("YYYY-MM-DD H:mm");
    const formatted = moment.parseZone(datetime).utc(-7).format("YYYY-MM-DD" + " " + "12:30");
    const nextDay = moment.parseZone(formatted).add(1, 'd').utc(-7).format("YYYY-MM-DD H:mm");
    const final = () => {
        return (moment(mst).format("H:mm"))
    }
    console.log(final())
})

// Token Auth
app.get('/api/auth', (request, response) => {
    const {token} = request.query;
    const url = process.env.LOCATIONS_URL
    const arr = {
        params: {
            token
        }
    }
    axios.get(url, arr, config)
    .then(res => {
        const firstLocation = res.data.data[0];
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(firstLocation));
    })
    .catch(err => {
        response.send(500, {Authenticated: false})
    })

});

// Get all locations
app.get('/api/locations', (request, response) => {
    const {token} = request.query;
    const url = process.env.LOCATIONS_URL
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
        response.send(500, {Authenticated: false})
    })

});

// Get all campaigns
app.get('/api/campaigns', (request, response) => {
    const {token} = request.query;
    const url = process.env.CAMPAIGNS_URL;
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
        response.send(500, {error: err})
    })
})

// Create Contact
app.post('/api/swell', (request, response) => {
    const {token, phone, name, email, locations, campaign_id, send_at} = request.body;
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
        sendInvite(res.data.id, token, locations, campaign_id, send_at, response)
    })
    .catch(err => {
        if (err.response.data.errors.email){
            getContact(email, phone, token, locations, campaign_id, send_at, response)
        } else if (err.response.data.errors.phone) {
            getContact(email, phone, token, locations, campaign_id, send_at, response)
        } else {
            console.log(err);
            response.send(500, {error: err})
        }
    })
});

// Get existing contact
getContact = (email, phone, token, locations, campaign_id, send_at, response) => {
    const url = process.env.CONTACTS_URL;
    const arr = {
        params: {
            token,
            email,
            phone
        }
    }
    axios.get(url, arr, config)
    .then(res => {
        const {id} = res.data.data[0];
        sendInvite(id, token, locations, campaign_id, send_at, response)
    })
    .catch(err => {
        console.log(err);
        response.send(500, {error: err})
    })
}

// Create Invite
sendInvite = (contact_id, token, location_id, campaign_id, send_at, response) => {
    const url = process.env.INVITES_URL;
    const datetime = new Date();
    const mst = moment.parseZone(datetime).utc(-7).format("YYYY-MM-DD H:mm");
    const formatted = moment.parseZone(datetime).utc(-7).format("YYYY-MM-DD" + " " + send_at);
    const nextDay = moment.parseZone(formatted).add(1, 'd').utc(-7).format("YYYY-MM-DD H:mm");
    const final = () => {
        if (formatted > mst) {
            return formatted;
        } else if (formatted < mst) {
            return nextDay;
        }
    }
    const arr = {
        token,
        location_id,
        contact_id,
        campaign_id,
        scheduled: true,
        send_at: final()
    };
    console.log(datetime)
    // axios.post(url, arr, config)
    // .then(res => {
    //     response.setHeader('Content-Type', 'application/json');
    //     response.end(JSON.stringify({ data: res.data }));
    // })
    // .catch(err => {
    //     console.log(err);
    //     response.send(500, {error: err})
    // })
}

app.listen(port, () => console.log(`Listening On Port ${port}`));