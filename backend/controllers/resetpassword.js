const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Sib = require('sib-api-v3-sdk');
const { v4: uuidv4 } = require('uuid');

const logger = require('../logger');
const User = require('../models/users');
const ForgotPassword = require('../models/forgotpassword');

require('dotenv').config();

const forgotpassword = async (req,res) => {
    try{
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error('User not found');
        }
        if(user)
        {
            const id = uuidv4();
            const expiresBy = new Date(Date.now() + 3600000); // Assuming the link expires in 1 hour
            await ForgotPassword.create({ user: user._id, active: true, expiresBy });

            const client = Sib.ApiClient.instance
            const apiKey = client.authentications['api-key']
            apiKey.apiKey = process.env.SB_API_KEY

            const tranEmailApi = new Sib.TransactionalEmailsApi()
            const sender = {
                email: 'amansuhag6014@gmail.com',
                name: 'Aman',
            }
            const receivers = [
                {
                    email: 'amansuhag6014@gmail.com',
                },
                {
                    email: email,
                },
            ]
            tranEmailApi
                .sendTransacEmail({
                    sender,
                    to: receivers,
                    subject: 'Reset Password Link',
                    textContent: `
                        Dear User,
                        This mail is sent to you in regarding the request you made to reset your Password.
                        `,
                    htmlContent: `
                        <h4>Dear User</h4>
                        <p>This mail is sent to you in regarding the request you made to reset your Password</p>
                        <a href="http://localhost:3000/password/resetpassword/${id}">click here</a>
                `,
                    params: {
                        role: 'Backend and Full stack',
                    },
                })
                .then(() => {
                    logger.info('Mail Sent To Reset Password : Success');
                    return res.status(202).json({ message: 'check your mail' })
                })
                .catch(console.log)
        }
        else{
            throw new Error('User doenot exist')
        }
    }catch(err){
        console.log(err)
        logger.error('Error processing request:', err);
        return res.json({ message: err,success: false});
    }
}

const resetpassword = async (req, res) => {
    try{
        const { id } = req.params;
        const forgotPasswordRequest = await ForgotPassword.findOne({ _id: id });

        if (!forgotPasswordRequest) {
            return res.status(404).json({ error: 'Forgot password request not found' });
        }

        forgotPasswordRequest.active = false;
        await forgotPasswordRequest.save();

        forgotPasswordRequest.update({ active: false});
            res.status(200).send(`<html>
                                    <script>
                                        function formsubmitted(e){
                                            e.preventDefault();
                                            console.log('called')
                                        }
                                    </script>

                                    <form action="/password/updatepassword/${id}" method="get">
                                        <label for="newpassword">Enter New password</label>
                                        <input name="newpassword" type="password" required></input>
                                        <button>reset password</button>
                                    </form>
                                </html>`
                                )
            res.end()
    }
    catch(err) {
        logger.error('Error processing Request',err);
    }
}
const updatepassword = async (req, res) => {

    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const forgotPasswordRequest = await ForgotPassword.findOne({ _id: id }).populate('user');

        if (!forgotPasswordRequest) {
            return res.status(404).json({ error: 'Forgot password request not found' });
        }

        const user = forgotPasswordRequest.user;
        const saltRounds = 10;
        const hash = await bcrypt.hash(newPassword, saltRounds);
        user.password = hash;

        await user.save();
        logger.info('Password updated successfully');
        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        logger.error('Error processing request:', error);
        return res.status(500).json({ error: error.message });
    }

}


module.exports = {
    forgotpassword,
    updatepassword,
    resetpassword
}