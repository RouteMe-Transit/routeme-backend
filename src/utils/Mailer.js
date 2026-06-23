const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"RouteMe" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your password reset code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Use the code below to reset your password. This code expires in 10 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px; background: #f4f4f4; text-align: center; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 13px; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };