const { primary, secondary } = require("../../config/nodeMailer");

function sendMail(to, subject, htmlContent, textContent, attachments = []) {
  const mailpass1 = process.env.MAIL_PASS;
  const mailpass2 = process.env.MAIL_PASS_SECONDARY;
  const mailuser1 = process.env.MAIL_USER;
  const mailuser2 = process.env.MAIL_USER_SECONDARY;
  const mailDetails = {
    from: process.env.MAIL_USER,
    to,
    subject,
    html: htmlContent,
    text: textContent || htmlContent.replace(/<[^>]+>/g, ""),
    ...(attachments.length > 0 && { attachments }),
  };

  // Try sending with primary
  primary.sendMail(mailDetails, (err, info) => {
    if (err) {
      console.error("Primary email failed:", err);

      // Try fallback sender
      const fallbackDetails = {
        ...mailDetails,
        from: process.env.MAIL_USER_SECONDARY,
      };

      secondary.sendMail(fallbackDetails, (err2, info2) => {
        if (err2) {
          console.error("Fallback email also failed:", err2);
        } else {
          console.log("Fallback email sent successfully:", info2);
        }
      });

    } else {
      console.log("Primary email sent successfully:", info);
    }
  });
}

module.exports = { sendMail };
