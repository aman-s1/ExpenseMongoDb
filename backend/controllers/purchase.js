const Razorpay = require('razorpay');
const Order = require('../models/orders');
const User = require('../models/users');
const logger = require('../logger');

const purchasepremium = async (req, res) => {
    try {
        const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const amount = 3000;

        rzp.orders.create({ amount, currency: "INR" }, async (err, order) => {
            if (err) {
                throw new Error(JSON.stringify(err));
            }
            try {
                const newOrder = await Order.create({ orderid: order.id, status: 'PENDING' ,userId: req.user._id});
                await req.user.createOrder(newOrder);
                logger.info('Payment Completed: Success');
                return res.status(201).json({ order, key_id: rzp.key_id });
            } catch (err) {
                throw new Error(err);
            }
        });
    } catch (err) {
        console.log(err);
        logger.error('Error processing request:', err);
        res.status(403).json({ message: 'Something went wrong', error: err });
    }
};

const updateTransactionStatus = async (req, res) => {
    try {
        const { payment_id, order_id } = req.body;
        
        // Update the order's status
        const updatedOrder = await Order.findOneAndUpdate(
            { orderid: order_id },
            { $set: { ispremium: true, paymentid: payment_id, status: 'SUCCESSFUL' } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Find the associated user using the userId from the order
        const user = await User.findById(updatedOrder.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user's premium status
        user.isPremiumUser = true;
        await user.save();

        logger.info('Transaction Status Updated: Success');
        return res.status(202).json({ success: true, message: "Transaction Successful" });
    } catch (err) {
        console.error(err);
        logger.error('Error processing request:', err);
        res.status(403).json({ error: err, message: 'Something went wrong' });
    }
};



module.exports = {
    purchasepremium,
    updateTransactionStatus
};
