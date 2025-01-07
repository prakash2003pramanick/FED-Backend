const mailTransporter = require('../../config/nodeMailer');
function sendMail(to, subject, htmlContent, textContent, attachments = []) {
    return new Promise((resolve, reject) => {
        let mailDetails = {
            from: process.env.MAIL_USER,
            to: to,
            subject: subject,
            html: htmlContent,
            text: textContent || htmlContent.replace(/<[^>]+>/g, ''),
            attachments: attachments
        };

        mailTransporter.sendMail(mailDetails, (err, data) => {
            if (err) {
                console.log('Error:', err);
                return reject(err);
            }
            console.log('Email sent successfully', data);
            resolve(data);
        });
    }).catch((err) => {
        // Optional: catch error globally if needed.
        console.log('Error while sending email', err);
    });
}

module.exports = { sendMail };
