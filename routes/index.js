const { Router } = require('express');
const auth = require('./auth');
const createContact = require('./createContact');
const locations = require('./locations');
const campaigns = require('./campaigns');
const sendInvite = require('./sendInvite');
const sendText = require('./sendText');
const textTemplates = require('./textTemplates');

const router = Router();

router.use('/auth', auth);
router.use('/createcontact', createContact);
router.use('/locations', locations);
router.use('/campaigns', campaigns);
router.use('/sendInvite', sendInvite);
router.use('/sendText', sendText);
router.use('/textTemplates', textTemplates);


module.exports = router;