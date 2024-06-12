const Expense = require('../models/expenses');
const User = require('../models/users');

const logger = require('../logger');

const AWS = require('aws-sdk');
const mongoose = require('mongoose');

function uploadToS3(data, filename){
    const BUCKET_NAME = process.env.BUC_NAME;
    const IAM_USER_KEY = process.env.I_AM_USER_KEY;
    const IAM_USER_SECRET = process.env.I_AM_USER_SECRET;

    let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,
        //Bucket: BUCKET_NAME
    })

    var params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: data,
        ACL: 'public-read'
    }
    return new Promise((resolve,reject) => {
        s3bucket.upload(params, (err, s3response) => {
            if(err)
            {
                console.log('Something went Wrong');
                logger.error('Error processing request:', error);
                reject(err);
            }else{
                console.log('Success', s3response);
                resolve(s3response.Location);
            }
        })
    })
}

const downloadExpense = async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.id }).lean();

        if (!expenses || expenses.length === 0) {
            return res.status(404).json({ error: 'No expenses found for the user', success: false });
        }

        const stringifiedExpenses = JSON.stringify(expenses);
        const userId = req.user.id;
        const filename = `Expenses_${userId}_${new Date().toISOString()}.txt`;

        const fileURL = await uploadToS3(stringifiedExpenses, filename);
        logger.info('Download Expense: Success');
        res.status(200).json({ fileURL, success: true });
    } catch (error) {
        console.error(error);
        logger.error('Error processing request:', error);
        res.status(500).json({ fileURL: '', success: false, error: 'Internal Server Error' });
    }
};

const addExpense = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const { expenseamount, description, category } = req.body;
    try {
        // Validate expense amount
        if (expenseamount === undefined || expenseamount <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ err: 'Expense Amount is Missing or Invalid' });
        }

        // Validate description and category
        if (!description || !category) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ err: 'Empty Parameters for Description or Category' });
        }

        // Create an expense record
        const createdExpense = await Expense.create(
            {
                expenseamount,
                description,
                category,
                userId: req.user._id,
            },
            { session }
        );

        // Update total expenses for the user
        const user = await User.findById(req.user._id);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            throw new Error('User not found');
        }

        user.totalExpenses += parseInt(expenseamount);
        console.log(createdExpense);
        user.expenseslist.push(createdExpense._id); // Add the expense ObjectId to expenseslist
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        logger.info('Expense Added: Success.');
        res.status(201).json({ expense: createdExpense });
    } catch (err) {
        console.error(err);
        logger.error('Error processing request:', err);
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ err: 'Failed to add expense' });
    }
};


const getExpenses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 7;

        // Check if page and pageSize are valid numbers
        if (isNaN(page) || isNaN(pageSize) || page <= 0 || pageSize <= 0) {
            return res.status(400).json({ error: 'Invalid page or pageSize values' });
        }

        const expenses = await Expense.find({ userId: req.user._id })
            .skip((page - 1) * pageSize)
            .limit(pageSize);
        
        logger.info('Got Expenses : Success');
        return res.status(200).json({ expenses });
    } catch (error) {
        logger.error('Error processing request:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

const deleteExpense = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const expenseId = req.params.expenseid;

        if (!expenseId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ err: 'Parameters Missing' });
        }

        const expense = await Expense.findById(expenseId).session(session);
        const user = await User.findById(req.user._id).session(session);

        if (!expense) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Expense not found' });
        }

        const totalExpenses = user.totalExpenses - parseInt(expense.expenseamount);

        await Expense.findByIdAndDelete(expenseId).session(session);

        await User.findByIdAndUpdate(
            req.user._id,
            { totalExpenses: totalExpenses },
            { session: session }
        );

        await session.commitTransaction();
        session.endSession();

        logger.info('Expense Deleted : Success');
        return res.status(200).json({ message: 'Deleted Successfully' });
    } catch (err) {
        console.error(err);
        logger.error('Error processing request:', err);
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ message: 'Failed' });
    }
};

const getExpenseSum = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('User ID:', userId);
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info('Got Expense Sum: Success');
        res.status(200).json({ sum: user.totalExpenses });
    } catch (error) {
        logger.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getExpensesByCategory = async (req, res) => {
    try {
        const userId = req.user._id;

        const expensesByCategory = await Expense.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            {
                $group: {
                    _id: "$category",
                    sum: { $sum: "$expenseamount" }
                }
            }
        ]);

        console.log('Expenses By Category:', expensesByCategory);

        if (!expensesByCategory) {
            return res.status(404).json({ error: 'Expenses not found' });
        }

        console.log('Got Expenses By Category : Success');
        res.status(200).json({ expenses: expensesByCategory });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};






module.exports = {
    addExpense,
    getExpenses,
    deleteExpense,
    getExpenseSum,
    getExpensesByCategory,
    downloadExpense
};
