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
    const {how, date, hour, minute, ampm} = request.body;
    const dateConverted = new Date(date)
    const year = dateConverted.getFullYear()
    const month = dateConverted.getMonth() < 9 ? `0${dateConverted.getMonth() + 1}` : dateConverted.getMonth() + 1;
    const day = dateConverted.getUTCDate() < 10 ? `0${dateConverted.getUTCDate()}` : dateConverted.getUTCDate();
    const hourConverted = ampm === 'AM' ? `0${hour}` : hour + 12;
    const scheduleDate = `${year}-${month}-${day}T${hourConverted}:${minute}:00-0700`;
    const scheduleDateFormatted = new Date(scheduleDate).toLocaleString("en-US", {timeZone: "America/Denver"});
    var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    var nextDay = new Date(dateConverted)
    nextDay.setDate(dateConverted.getDate() + 1)
    const thisYear = new Date(now).getFullYear().toLocaleString();
    const thisMonth = new Date(now).getMonth().toLocaleString();
    const thisDay =  new Date(now).getUTCDate().toLocaleString()

    // scheduled for a date at a time
    console.log(`${year}-${month}-${day} ${hourConverted}:${minute}`)

    // today at a time
    console.log(moment(now).format("YYYY-MM-DD") + ` ${hourConverted}:${minute}`)

    if (date) {
        return console.log(date)
    } else {
        return console.log("No Date")
    }

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
    const {token, phone, name, email, locations, campaign_id, how, date, hour, ampm, minute} = request.body;
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
            return sendInviteScheduled(res.data.id, token, locations, campaign_id, how, date, hour, minute, ampm, response)
        }
    })
    .catch(err => {
        if (err.response.data.errors.email){
            getContact(email, phone, token, locations, campaign_id, how, date, hour, minute, ampm, response)
        } else if (err.response.data.errors.phone) {
            getContact(email, phone, token, locations, campaign_id, how, date, hour, minute, ampm, response)
        } else {
            console.log(err);
            response.send(500, {error: err})
        }
    })
});

// Get existing contact
getContact = (email, phone, token, locations, campaign_id, how, date, hour, minute, ampm, response) => {
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
            return sendInviteScheduled(id, token, locations, campaign_id, how, date, hour, minute, ampm, response)
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

sendInviteScheduled = (contact_id, token, location_id, campaign_id, how, date, hour, minute, ampm, response) => {
    if (date) {
        return scheduleInvite(contact_id, token, location_id, campaign_id, how, date, hour, minute, ampm, response)
    } else {
        return sendTodayAtTime(contact_id, token, location_id, campaign_id, date, hour, minute, ampm, response)
    }
}

scheduleInvite = (contact_id, token, location_id, campaign_id, how, date, hour, minute, ampm, response) => {
    const url = process.env.INVITES_URL;
    const dateConverted = new Date(date)
    const year = dateConverted.getFullYear()
    const month = dateConverted.getMonth() < 9 ? `0${dateConverted.getMonth() + 1}` : dateConverted.getMonth() + 1;
    const day = dateConverted.getUTCDate() < 10 ? `0${dateConverted.getUTCDate()}` : dateConverted.getUTCDate();
    const hourConverted = ampm === 'AM' ? `0${hour}` : hour + 12;
    const scheduleDate = `${year}-${month}-${day} ${hourConverted}:${minute}`;
    const arr = {
        token,
        location_id,
        contact_id,
        campaign_id,
        scheduled: true,
        send_at: scheduleDate
    };
    return (
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
    )
}

sendTodayAtTime = (contact_id, token, location_id, campaign_id, date, hour, minute, ampm, response) => {
    const dateConverted = new Date(date)
    const hourConverted = ampm === 'AM' ? `0${hour}` : hour + 12;
    var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    const thisYear = new Date(now).getFullYear()
    const thisMonth = new Date(now).getMonth()
    const thisDay =  new Date(now).getUTCDate()
    const scheduleDate = `${thisYear}-${thisMonth}-${thisDay}T${hourConverted}:${minute}:00-0700`;
    const scheduleDateFormatted = new Date(scheduleDate).toLocaleString("en-US", {timeZone: "America/Denver"});

    return (
        console.log(now),
        console.log(scheduleDateFormatted)
    )

    // if (new Date(now).toLocaleString() > scheduleDateFormatted ) {
    //     const hourConverted = ampm === 'AM' ? `0${hour}` : hour + 12;
    //     var nextDay = new Date(dateConverted)
    //     nextDay.setDate(dateConverted.getDate() + 1)
    //     const url = process.env.INVITES_URL;
    //     const tommorow = moment(nextDay).format('YYYY-MM-DD') + ' ' + `${hourConverted}:${minute}`;
    //     const arr = {
    //         token,
    //         location_id,
    //         contact_id,
    //         campaign_id,
    //         scheduled: true,
    //         send_at: tommorow
    //     };
    //     return(
    //         axios.post(url, arr, config)
    //         .then(res => {
    //             response.setHeader('Content-Type', 'application/json');
    //             response.end(JSON.stringify({ data: res.data }));
    //         })
    //         .catch(err => {
    //             if (err.response.data.contact_id) {
    //                 console.log(err.response.data.message)
    //                 response.status(200).send({message: err.response.data.message})
    //             } else {
    //                 console.log(err);
    //                 response.status(500)({error: err})
    //             }
    //         })
    //     )
    // } else {
    //     const url = process.env.INVITES_URL;
    //     const dateConverted = new Date(date)
    //     const hourConverted = ampm === 'AM' ? `0${hour}` : hour + 12;
    //     var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    //     const today = `${moment(now).format("YYYY-MM-DD")} ${hourConverted}:${minute}`;
    //     const arr = {
    //         token,
    //         location_id,
    //         contact_id,
    //         campaign_id,
    //         scheduled: true,
    //         send_at: today
    //     };
    //     return(
    //         axios.post(url, arr, config)
    //         .then(res => {
    //             response.setHeader('Content-Type', 'application/json');
    //             response.end(JSON.stringify({ data: res.data }));
    //         })
    //         .catch(err => {
    //             if (err.response.data.contact_id) {
    //                 console.log(err.response.data.message)
    //                 response.status(200).send({message: err.response.data.message})
    //             } else {
    //                 console.log(err);
    //                 response.status(500)({error: err})
    //             }
    //         })
    //     )
    // }

}

app.listen(port, () => console.log(`Listening On Port ${port}`));