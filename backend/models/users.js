const mongoose = require('mongoose');

const Order = require('./orders');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isPremiumUser: {
        type: String
    },
    totalExpenses: {
        type: Number,
        default: 0
    },
    expenseslist: [{
        type: Schema.Types.ObjectId,
        ref: 'Expense'
    }]
});

userSchema.methods.createOrder = async function(orderData) {
    try {
        orderData.userId = this._id;
        const order = new Order(orderData);
        await order.save();
        return order;
    } catch (error) {
        throw new Error(error);
    }
};

module.exports = mongoose.model('User',userSchema);

// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');

// const User = sequelize.define('user', {
//     id: {
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     name: Sequelize.STRING,
//     email: {
//         type: Sequelize.STRING,
//         allowNull: false,
//         unique: true
//     },
//     password: Sequelize.STRING,
//     ispremiumuser: Sequelize.STRING,
//     totalExpenses: {
//         type: Sequelize.INTEGER,
//         defaultValue: 0
//     }
// });

// module.exports = User;