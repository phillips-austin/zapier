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
    const {hour, ampm} = request.body;
    const hourConverted = () => {
        if (hour === 12) {
            return hour;
        } else {
            return hour + 25
        }
    }

    console.log(hourConverted())
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
        response.status(500).send({Authenticated: false})
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
        response.status(500).send({message: err.response.data.message})
    })
})

// Create Contact Action
app.post('/api/createcontact', (request, response) => {
    var {name, phone, email, locations} = request.body;
    const {token} = request.query;
    email = email.split(',')[0];
    phone = phone.split(',')[0];
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
        response.status(200).send(res.data)
    })
    .catch(err => {
        if (err.response.data.errors.phone) response.status(200).send({message: `Contact with phone number: ${phone} already exists.`});
        else if (err.response.data.errors.email) response.status(200).send({message: `Contact with email: ${email} already exists.`});
        else response.status(500).send(err.response.data);
    })
})

// Create Contact
app.post('/api/swell', (request, response) => {
    var {token, phone, name, email, locations, campaign_id, how, date, hour, ampm, minute} = request.body;
    email = email.split(',')[0];
    phone = phone.split(',')[0];
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
            getContactByEmail(email, token, locations, campaign_id, how, date, hour, minute, ampm, response)
        } else if (err.response.data.errors.phone) {
            getContactByPhone(phone, token, locations, campaign_id, how, date, hour, minute, ampm, response)
        } else {
            console.log(err);
            response.status(500).send({message: err.response.data.message})
        }
    })
});

// Get existing contact by the email that is used
getContactByEmail = (email, token, locations, campaign_id, how, date, hour, minute, ampm, response) => {
    const url = process.env.CONTACTS_URL;
    const arr = {
        params: {
            token,
            email        
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
        response.status(500).send({message: err.response.data.message})
    })
}

// Get existing contact by the phone that is used
getContactByPhone = (phone, token, locations, campaign_id, how, date, hour, minute, ampm, response) => {
    const url = process.env.CONTACTS_URL;
    const arr = {
        params: {
            token,
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
        response.status(500).send({message: err.response.data.message})
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
            response.status(500).send({message: err.response.data.message})
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
    const hourConverted = () => {
        if (hour === 12) {
            return hour;
        } else {
            if (ampm === 'AM') {
                return `0${hour}`;
            } else if (ampm === 'PM') {
                return hour + 12;
            }
        }
    }
    var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    now = new Date(now)
    const scheduleDate = `${year}-${month}-${day} ${hourConverted()}:${minute}`;

    if (new Date(now).getTime() > new Date(scheduleDate).getTime()) {
        function addZero(n){
            if (n <= 9) {
                return '0' + n
            }
              return n
        }
        var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
        now = new Date(now);
        var nextDay = new Date(now)
        nextDay.setDate(now.getDate() + 1)
        const tomorrow = new Date(nextDay)
        const tomorrowFormatted = tomorrow.getFullYear() + '-' + addZero(tomorrow.getMonth() + 1) + '-' + addZero(tomorrow.getDate()) + ' ' + hourConverted + ':' + minute;
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: tomorrowFormatted
        };
        return(
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
                    response.status(500).send({message: err.response.data.message})
                }
            })
        )
    } else {
        const dateConverted = new Date(date)
        const year = dateConverted.getFullYear()
        const month = dateConverted.getMonth() < 9 ? `0${dateConverted.getMonth() + 1}` : dateConverted.getMonth() + 1;
        const day = dateConverted.getUTCDate() < 10 ? `0${dateConverted.getUTCDate()}` : dateConverted.getUTCDate();
        const hourConverted = () => {
            if (hour === 12) {
                return hour;
            } else {
                if (ampm === 'AM') {
                    return `0${hour}`;
                } else if (ampm === 'PM') {
                    return hour + 12;
                }
            }
        }
        const scheduleDate = `${year}-${month}-${day} ${hourConverted()}:${minute}`;
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
                    response.status(500).send({message: err.response.data.message})
                }
            })
        )
    }
}

sendTodayAtTime = (contact_id, token, location_id, campaign_id, date, hour, minute, ampm, response) => {
    const dateConverted = new Date(date)
    const hourConverted = () => {
        if (hour === 12) {
            return hour;
        } else {
            if (ampm === 'AM') {
                return `0${hour}`;
            } else if (ampm === 'PM') {
                return hour + 12;
            }
        }
    }
    function addZero(n){
        if (n <= 9) {
            return '0' + n
        }
          return n
    }
    var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
    now = new Date(now)
    const todayScheduled = now.getFullYear() + '-' + addZero(now.getMonth() + 1) + '-' + addZero(now.getDate()) + ' ' + hourConverted() + ':' + minute;

    if (new Date(now).getTime() > new Date(todayScheduled).getTime()) {
        const url = process.env.INVITES_URL;
        function addZero(n){
            if (n <= 9) {
                return '0' + n
            }
              return n
        }
        var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
        now = new Date(now);
        var nextDay = new Date(now)
        nextDay.setDate(now.getDate() + 1)
        const tomorrow = new Date(nextDay)
        const tomorrowFormatted = tomorrow.getFullYear() + '-' + addZero(tomorrow.getMonth() + 1) + '-' + addZero(tomorrow.getDate()) + ' ' + hourConverted() + ':' + minute;
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: tomorrowFormatted
        };
        return(
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
                    response.status(500).send({message: err.response.data.message})
                }
            })
        )
    } else {
        const url = process.env.INVITES_URL;
        function addZero(n){
            if (n <= 9) {
                return '0' + n
            }
              return n
        }
        const hourConverted = () => {
            if (hour === 12) {
                return hour;
            } else {
                if (ampm === 'AM') {
                    return `0${hour}`;
                } else if (ampm === 'PM') {
                    return hour + 12;
                }
            }
        }
        var now = new Date().toLocaleString("en-US", {timeZone: "America/Denver"});
        now = new Date(now)
        const todayScheduled = now.getFullYear() + '-' + addZero(now.getMonth() + 1) + '-' + addZero(now.getDate()) + ' ' + hourConverted() + ':' + minute;
        const arr = {
            token,
            location_id,
            contact_id,
            campaign_id,
            scheduled: true,
            send_at: todayScheduled
        };
        return(
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
                    response.status(500).send({message: err.response.data.message})
                }
            })
        )
    }

}

app.listen(port, () => console.log(`Listening On Port ${port}`));