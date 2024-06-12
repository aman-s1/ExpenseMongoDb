const User = require('../models/users'); // Assuming you have defined the User model in Mongoose
const logger = require('../logger');

const getuserLeaderBoard = async (req, res) => {
    try {
        const leaderboardUsers = await User.find({})
            .sort({ totalExpenses: -1 }); // Sort by totalExpenses in descending order
        
        console.log(leaderboardUsers);
        logger.info('Got LeaderBoard Array : Success');
        
        res.status(200).json(leaderboardUsers);
    } catch (err) {
        console.log(err);
        logger.error('Error processing request:', err);
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    getuserLeaderBoard
};
