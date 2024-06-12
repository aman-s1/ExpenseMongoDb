const express = require('express');

const premiumFeatureController = require('../controllers/premiumFeature');

const authenticationmiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/showLeaderBoard', authenticationmiddleware.authenticate, premiumFeatureController.getuserLeaderBoard);

module.exports = router;