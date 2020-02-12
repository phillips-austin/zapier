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
app.post('/api/test', (request, res) => {
    const {how, date, time, ampm} = request.body;
    const dateConverted = new Date(date)
    const timeConverted = time.split(':')
    const year = dateConverted.getFullYear()
    const month = dateConverted.getMonth() < 9 ? `0${dateConverted.getMonth() + 1}` : dateConverted.getMonth() + 1;
    const day = dateConverted.getUTCDate() < 10 ? `0${dateConverted.getUTCDate()}` : dateConverted.getUTCDate();
    const hour = Number(timeConverted[0])
    const hourConverted = ampm === 'AM' ? `0${hour}` : hour + 12;
    const minute = Number(timeConverted[1]);
    const scheduleDate = `${year}-${month}-${day}T${hourConverted}:${minute}:00-0700`;
    const formattedDate = moment(date).format("YYYY-MM-DD");
    const finalDate = formattedDate + ' ' + `${hourConverted}:${minute}`
    var utTime = new Date(scheduleDate).getTime();
    const now = new Date().getTime();
    var usaTime = new Date(time).toLocaleString("en-US", {timeZone: "America/New_York"});
    console.log(utTime > now)
    console.log(new Date(usaTime).toLocaleTimeString())

    res.sendStatus(200)
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
        response.status(500)({Authenticated: false})
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
        response.status(500).send({Authenticated: false})
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
        response.status(500).send({error: err})
    })
})

// Create Contact
app.post('/api/swell', (request, response) => {
    const {token, phone, name, email, locations, campaign_id, how, date, time} = request.body;
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
        if (how === 'Instant') {
            return sendInvite(res.data.id, token, locations, campaign_id, response)
        } else {
            return sendInviteScheduled(res.data.id, token, locations, campaign_id, how, date, time, response)
        }
    })
    .catch(err => {
        if (err.response.data.errors.email){
            getContact(email, phone, token, locations, campaign_id, how, date, time, response)
        } else if (err.response.data.errors.phone) {
            getContact(email, phone, token, locations, campaign_id, how, date, time, response)
        } else {
            console.log(err);
            response.send(500, {error: err})
        }
    })
});

// Get existing contact
getContact = (email, phone, token, locations, campaign_id, how, date, time, response) => {
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
        if (how === 'Instant') {
            return sendInvite(id, token, locations, campaign_id, response)
        } else {
            return sendInviteScheduled(id, token, locations, campaign_id, how, date, time, response)
        }
    })
    .catch(err => {
        console.log(err);
        response.send(500, {error: err})
    })
}

// Create Invite
sendInvite = (contact_id, token, location_id, campaign_id, response) => {
    const url = process.env.INVITES_URL;
    const arr = {
        token,
        location_id,
        contact_id,
        campaign_id,
        scheduled: false
    };
    axios.post(url, arr, config)
    .then(res => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ data: res.data }));
    })
    .catch(err => {
        if (err.response.data.contact_id) {
            console.log(err.response.data.message)
            response.status(200).send({message: err.response.data.message})
        } else {
            console.log(err);
            response.status(500)({error: err})
        }
    })
}

sendInviteScheduled = (contact_id, token, location_id, campaign_id, how, date, time, response) => {
    if (date) {
        return scheduleInvite(contact_id, token, location_id, campaign_id, how, date, time, response)
    } else {
        return sendTodayAtTime(contact_id, token, location_id, campaign_id, how, date, time, response)
    }
}

scheduleInvite = (contact_id, token, location_id, campaign_id, how, date, time, response) => {
    return null
}

sendTodayAtTime = (contact_id, token, location_id, campaign_id, how, date, time, response) => {
return null
}

app.listen(port, () => console.log(`Listening On Port ${port}`));