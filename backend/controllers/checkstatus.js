const User = require('../models/users');
const logger = require('../logger');

const checkPremiumStatus = async (userId) => {
  try {
      // Retrieve user
      const user = await User.findById(userId);

      if (!user) {
          return { status: 404, message: 'User not found' };
      }

      // Check if the user is a premium user
      const isPremium = user.isPremiumUser === 'true';
      logger.info('Request To check Premium: Success.');
      return { status: 200, isPremium };
  } catch (error) {
      console.error(error);
      logger.error('Error processing request:', error);
      return { status: 500, message: 'Failed to check premium status' };
  }
};

module.exports = {
    checkPremiumStatus
};
