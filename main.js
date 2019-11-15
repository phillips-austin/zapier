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

app.post('/api/auth', (request, response) => {
    const {token} = request.body;
    const url = process.env.CONTACTS_URL
    const arr = {
        token
    }
    axios.get(url, arr, config)
    .then(res => {
        console.log(res)
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ message: "Success" }));
    })
    .catch(err => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ message: "Failed" }));
    })

});

app.post('/api/contact', (request, response) => {
    console.log(request.body)
    response.send(200, request.body)
})

app.listen(port, () => console.log(`Listening On Port ${port}`));