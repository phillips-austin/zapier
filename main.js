const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
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

app.post('/api/auth', (req, res) => {
    console.log(req)
    res.send(req.body.token)
});

app.post('/api/contact', (request, response) => {
    console.log(request.body)
    response.send(200, request.body)
})

app.listen(port, () => console.log(`Listening On Port ${port}`));