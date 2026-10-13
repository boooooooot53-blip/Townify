const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: `"Townify" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Townify Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Password Reset</h2>
        <p style="color: #555;">Use the code below to reset your Townify password. It expires in <strong>10 minutes</strong>.</p>
        <div style="margin: 32px 0; text-align: center;">
          <span style="font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #4f46e5;">
            ${otp}
          </span>
        </div>
        <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
