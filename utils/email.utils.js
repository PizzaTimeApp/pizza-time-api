const nodemailer = require("nodemailer");
const BASE_URL = "http://localhost:8100/api/user";

module.exports = {
    emailData:function(email, token) {

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            service: 'gmail',
            auth: {
              user: 'compte.projetperso@gmail.com',
              pass: 'quentindu13530',
            },
          });

        const mailOptions = {
            from: "compte.projetperso@gmail.com", 
            to: email,
            subject: "Account Reset Password Link",
            html: `<p>Please click on the following link for reset your password :</p><br>
            <a href="${BASE_URL}/resetpassword/${token}">${BASE_URL}/resetpassword/${token}</a>`
        };

        return new Promise(function(resolve, reject) {
            transporter.sendMail(mailOptions)
            .then(info => {
                resolve(info);
            }).catch(console.error);
        })
    }
}