const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');

const userRoutes = require('./routes/user');
const expenseRoutes = require('./routes/expense');
const purchaseRoutes = require('./routes/purchase');
const checkRoutes = require('./routes/checkstatus');
const premiumFeatureRoutes = require('./routes/premiumFeature');
const resetPasswordRoutes = require('./routes/resetpassword');

const app = express();

const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));

app.use(express.json());
app.use('/user',userRoutes);
app.use('/password',resetPasswordRoutes);
app.use('/expense',expenseRoutes);
app.use('/checkpremium',checkRoutes);
app.use('/purchase',purchaseRoutes);
app.use('/premium',premiumFeatureRoutes);

mongoose.connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`
    )
    .then(result => {
      app.listen(3000);
      console.log('Connected!');
  }).catch(err => {
    console.log(err);
  });