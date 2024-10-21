const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a test account and transporter using Ethereal Email
    let testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: testAccount.user, // Generated ethereal user
            pass: testAccount.pass  // Generated ethereal password
        }
    });

    // Define email options
    let mailOptions = {
        from: '"Your App Name" <no-reply@example.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    // Send the email
    let info = await transporter.sendMail(mailOptions);

    // Log the preview URL for development purposes
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
