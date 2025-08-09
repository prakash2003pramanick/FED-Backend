const mailTransporter = require("../../config/nodeMailer");

function sendMail(to, subject, htmlContent, textContent, attachments = []) {
  return new Promise((resolve) => {
    const mailDetails = {
      from: process.env.MAIL_USER,
      to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]+>/g, ""),
      ...(attachments.length > 0 && { attachments })
    };

    mailTransporter.sendMail(mailDetails, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return resolve({
          success: false,
          error: err.message || String(err),
          fullError: err
        });
      }
      console.log("Email sent successfully:", info);
      resolve({ success: true, data: info });
    });
  }).catch((err) => {
    // Just in case something unexpected happens before sendMail callback
    console.error("Unexpected sendMail error:", err);
    return { success: false, error: String(err) };
  });
}

module.exports = { sendMail };
