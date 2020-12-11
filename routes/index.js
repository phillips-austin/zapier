const { Router } = require('express');
const auth = require('./auth');
const createContact = require('./createContact');
const locations = require('./locations');
const campaigns = require('./campaigns');
const sendInvite = require('./sendInvite');

const router = Router();

router.use('/auth', auth);
router.use('/createcontact', createContact);
router.use('/locations', locations);
router.use('/campaigns', campaigns);
router.use('/sendInvite', sendInvite);


module.exports = router;