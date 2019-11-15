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

// Token Auth
app.post('/api/auth', (request, response) => {
    const {token} = request.body;
    const url = process.env.LOCATIONS_URL
    const arr = {
        params: {
            token
        }
    }
    axios.get(url, arr, config)
    .then(res => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ Authenticated: true }));
    })
    .catch(err => {
        response.send(500, {Authenticated: false})
    })

});

// Create Contact
app.post('/api/contact', (request, response) => {
    const {token, phone, name, email, locations} = request.body;
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
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ id: res.data.id, locations_id: locations }));
    })
    .catch(err => {
        console.log(err)
        response.send(500, {Authenticated: false})
    })
});

app.post('/api/invite', (request, response) => {
    const {token, location_id, send_at, contact_id, campaign_id} = request.body;
    const url = process.env.INVITES_URL;
    const datetime = new Date();
    const formatted = moment(datetime).format("YYYY-MM-DD" + " " + send_at)
    const arr = {
        token,
        location_id,
        contact_id,
        campaign_id,
        scheduled: true,
        send_at: formatted
    };
    axios.post(url, arr, config)
    .then(res => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ status: "Success" }));
    })
    .catch(err => {
        console.log(err.response.data)
        response.send(500, {Message: "Invite failed to schedule"})
    })
})

app.listen(port, () => console.log(`Listening On Port ${port}`));