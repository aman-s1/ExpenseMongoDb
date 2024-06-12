const express = require('express');
const authenticate = require('../middleware/auth');
const checkStatusController = require('../controllers/checkstatus');

const router = express.Router();

router.get('/:userId', authenticate.authenticate, async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: 'Invalid userId' });
        }

        const result = await checkStatusController.checkPremiumStatus(userId);

        if (result.status === 200) {
            res.status(200).json({ isPremium: result.isPremium });
        } else {
            res.status(result.status).json({ message: result.message });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
