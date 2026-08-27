require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Gửi email
 *
 * @param {string} to - Email người nhận
 * @param {string} subject - Tiêu đề
 * @param {string} content - Nội dung email
 */
async function sendEmail(to, subject, content) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: to,
    subject: subject,
    text: content,
  };

  const result = await transporter.sendMail(mailOptions);

  return result;
}

module.exports = sendEmail;