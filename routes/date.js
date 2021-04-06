const router = require('express').Router();  

// Format incoming date
router.get('/', (request, response) => {
    var {date, operator, unit} = request.body;
    const incomingDate = new Date(date)

    console.log(request.body)

    // if(operator === 'Add') {
    //     add(incomingDate, unit)
    //     .then(res => {
    //         console.log({Date: res})
    //         response.json({date: res})
    //     })
    //     .catch(err => {
    //         response.status(500).send({message: "oops something went wrong, please try again."})
    //     })
    // } else {
    //     minus(incomingDate, unit)
    //     .then(res => {
    //         console.log({Date: res})
    //         response.json({date: res})
    //     })
    //     .catch(err => {
    //         response.status(500).send({message: "oops something went wrong, please try again."})
    //     })
    // }

    async function add(incomingDate, unit) {
        const data = await new Date(incomingDate.setDate(incomingDate.getDate()+ unit))
        return data
    }

    async function minus(incomingDate, unit) {
        const data = await new Date(incomingDate.setDate(incomingDate.getDate()- unit))
        return data
    }
});

module.exports = router;