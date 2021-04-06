const { Router } = require('express');
const auth = require('./auth');
const createContact = require('./createContact');
const locations = require('./locations');
const campaigns = require('./campaigns');
const invite = require('./invite');
const sendText = require('./sendText');
const textTemplates = require('./textTemplates');
const date = require('./date');

const router = Router();

router.use('/auth', auth);
router.use('/createcontact', createContact);
router.use('/locations', locations);
router.use('/campaigns', campaigns);
router.use('/invite', invite);
router.use('/sendText', sendText);
router.use('/textTemplates', textTemplates);
router.use('/date', date);


module.exports = router;