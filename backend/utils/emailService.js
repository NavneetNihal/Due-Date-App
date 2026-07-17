import nodemailer from 'nodemailer';

// Create transporter lazily (inside function) so env vars are loaded before use
const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export const sendVerificationEmail = async (toEmail, code) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Due Date App" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `Your Due Date verification code: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0f18; color: #e2e8f0; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #a78bfa; margin-bottom: 8px;">Due Date App</h2>
        <p style="color: #94a3b8; margin-bottom: 24px;">Gym Payment Reminder Platform</p>
        <hr style="border-color: #1e293b; margin-bottom: 24px;" />
        <h3 style="margin-bottom: 8px;">Verify your email address</h3>
        <p style="color: #94a3b8; margin-bottom: 24px;">Use the code below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; letter-spacing: 12px; font-size: 36px; font-weight: bold; color: #a78bfa; margin-bottom: 24px;">
          ${code}
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't create an account on Due Date, ignore this email.</p>
      </div>
    `
  });
};
