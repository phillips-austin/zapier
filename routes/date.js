const router = require('express').Router();  

// Format incoming date
router.get('/', (request, response) => {
    var {date, operator, unit} = request.body;
    const incomingDate = new Date(date)
    operator = operator === "Add" ? add(incomingDate, unit) : minus(incomingDate, unit);

    function add(date, unit) {
        return new Date(date.setDate(date.getDate()+ unit))
    }

    function minus(date, unit) {
        return new Date(date.setDate(date.getDate()- unit))
    }

    response.json({date: operator})
});

module.exports = router;