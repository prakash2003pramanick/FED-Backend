const { primary, secondary, tertiary, mailerSend } = require("../../config/nodeMailer");

function sendMail(to, subject, htmlContent, textContent, attachments = []) {
  const mailDetails = {
    from: `"FED KIIT Compliance" <${process.env.MAIL_USER}>`,
    to,
    subject,
    replyTo: "fedkiit@gmail.com",
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
              mailerSend.sendMail({ ...mailDetails, from: '"FED KIIT Compliance" <support@fedkiit.com>' }, (err4, info4) => {
                if (err4) {
                  console.error("MailerSend email also failed:", err4);
                } else {
                  console.log("MailerSend email sent successfully:", info4);
                }
              });
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
