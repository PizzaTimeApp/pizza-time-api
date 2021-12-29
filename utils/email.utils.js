const nodemailer = require("nodemailer");

require('dotenv').config()

module.exports = {
    emailData:function(email, token) {

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            service: 'gmail',
            auth: {
              user: process.env.USER_GMAIL,
              pass: process.env.PASSWORD_GMAIL,
            },
          });

        const mailOptions = {
            from: process.env.USER_GMAIL, 
            to: email,
            subject: process.env.SUBJECT_GMAIL,
            html: `<p>Please click on the following link for reset your password :</p><br>
            <a href="${process.env.BASE_URL_GMAIL}/resetpassword/${token}">${process.env.BASE_URL_GMAIL}/resetpassword/${token}</a>`
        };

        return new Promise(function(resolve, reject) {
            transporter.sendMail(mailOptions)
            .then(info => {
                resolve(info);
            }).catch(console.error);
        })
    }
}