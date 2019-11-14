const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(cors());
app.use((err, req, res, next) => {
    res.json(err);
});

app.get('/api/contact', (req, res) => {
    res.send(200, {message: 'Authenticated'})
});

app.post('/api/contact', (request, response) => {
    console.log(request.body)
    response.send(200, request.body)
})

app.listen(port, () => console.log(`Listening On Port ${port}`));