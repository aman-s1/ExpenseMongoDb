const express = require('express');

const expenseController = require('../controllers/expense');
const userAuthentication = require('../middleware/auth');

const router = express.Router();

router.post('/addexpense', userAuthentication.authenticate, expenseController.addExpense);

router.get('/getexpenses', userAuthentication.authenticate, expenseController.getExpenses);

router.get('/download', userAuthentication.authenticate, expenseController.downloadExpense);

router.delete('/deleteexpense/:expenseid', userAuthentication.authenticate, expenseController.deleteExpense);

router.get('/gettotalexpensesum', userAuthentication.authenticate, expenseController.getExpenseSum);

router.get('/getexpensesbycategory', userAuthentication.authenticate, expenseController.getExpensesByCategory);

module.exports = router;