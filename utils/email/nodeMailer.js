const { primary, secondary, tertiary } = require("../../config/nodeMailer");

function sendMail(to, subject, htmlContent, textContent, attachments = []) {
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
          console.error("Secondary email also failed:", err2);

          // Try tertiary sender
          const tertiaryDetails = {
            ...mailDetails,
            from: process.env.MAIL_USER_TERTIARY,
          };
          tertiary.sendMail(tertiaryDetails, (err3, info3) => {
            if (err3) {
              console.error("Tertiary email also failed:", err3);
            }
            else {
              console.log("Tertiary email sent successfully:", info3);
            }
          });
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
