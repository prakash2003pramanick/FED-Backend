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


const mailTransporterSecondary = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER_SECONDARY,
        pass: process.env.MAIL_PASS_SECONDARY,
    },
});

const mailTransporterTertiary = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER_TERTIARY,
        pass: process.env.MAIL_PASS_TERTIARY,
    },
});

module.exports = {
    primary: mailTransporterPrimary,
    secondary: mailTransporterSecondary,
    tertiary: mailTransporterTertiary
};
