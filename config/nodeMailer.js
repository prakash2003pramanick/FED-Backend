// config/nodeMailer.js
const nodemailer = require("nodemailer");

// Primary transporter (e.g., Gmail)
const mailTransporterPrimary = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Secondary transporter (e.g., Gmail SMTP)
const mailTransporterSecondary = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER_SECONDARY, // Brevo SMTP login
        pass: process.env.MAIL_PASS_SECONDARY, // Brevo SMTP password
    },
});

module.exports = {
    primary: mailTransporterPrimary,
    secondary: mailTransporterSecondary,
};
