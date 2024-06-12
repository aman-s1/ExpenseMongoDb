const jwt = require('jsonwebtoken');
const User = require('../models/users');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        console.log(token);

        if (!token) {
            return res.status(401).json({ success: false, message: 'Token not provided' });
        }

        const decodedToken = jwt.verify(token, '6b64e201b0e7ec99dfce661f082aef021e71468d97966944a694ae0101e7319b');

        try {
            const foundUser = await User.findById(decodedToken.userId);
            if (!foundUser) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            req.user = foundUser;
            console.log(req.user);
            next();
        } catch (err) {
            throw new Error(err);
        }
    } catch (err) {
        console.error(err);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

module.exports = {
    authenticate
};
