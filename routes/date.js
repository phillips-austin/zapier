const router = require('express').Router();  

// Format incoming date
router.get('/', (request, response) => {
    var {date, operator, unit} = request.body;
    const incomingDate = new Date(date)

    if(operator === 'Add') {
        add(incomingDate, unit)
        .then(res => {
            response.json({date: res})
        })
        .catch(err => {
            response.status(500).send({message: "oops something went wrong, please try again."})
        })
    } else {
        minus(incomingDate, unit)
        .then(res => {
            response.json({date: res})
        })
        .catch(err => {
            response.status(500).send({message: "oops something went wrong, please try again."})
        })
    }

    async function add(date, unit) {
        const data = await new Date(date.setDate(date.getDate()+ unit))
        return data
    }

    async function minus(date, unit) {
        const data = await new Date(date.setDate(date.getDate()- unit))
        return data
    }
});

module.exports = router;