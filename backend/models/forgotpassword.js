const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const forgotpassSchema = new Schema({
    active: {
        type: Boolean
    },
    expiresby: {
        type: Date
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Forgot', forgotpassSchema);