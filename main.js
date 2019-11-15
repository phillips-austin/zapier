const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
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
    const url = process.env.CONTACTS_URL
    const arr = {
        params: {
            token
        }
    }
    axios.get(url, arr, config)
    .then(res => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ Authenticated: true, token }));
    })
    .catch(err => {
        response.send(500, {Authenticated: false})
    })

});

// Create Contact
app.post('/api/contact', (request, response) => {
    console.log(request.body)
})

app.listen(port, () => console.log(`Listening On Port ${port}`));