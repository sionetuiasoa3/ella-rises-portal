import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || 'ellarisescorporate@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('📧 Email config loaded:', { 
  user: EMAIL_USER, 
  passConfigured: !!EMAIL_PASS,
  passLength: EMAIL_PASS?.length 
});

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

export async function sendEmail({ to, subject, html, text }) {
  console.log('📧 Attempting to send email to:', to);
  
  // If email credentials aren't configured, log and return mock
  if (!EMAIL_PASS) {
    console.log('📧 [EMAIL NOT CONFIGURED] Would send email:', {
      to,
      subject,
      text: text?.substring(0, 200) + '...',
    });
    console.log('⚠️  Set EMAIL_PASS in .env to enable email sending');
    return { messageId: 'dev-mock-message-id' };
  }

  try {
    console.log('📧 Sending via Gmail SMTP...');
    const info = await transporter.sendMail({
      from: `"Ella Rises" <${EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log('📧 Email sent successfully:', info.messageId);
    console.log('📧 Response:', info.response);
    return info;
  } catch (error) {
    console.error('📧 Error sending email:', error.message);
    console.error('📧 Full error:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(participant, resetLink) {
  const subject = 'Reset your Ella Rises password';
  
  const text = `Hi ${participant.ParticipantFirstName || 'there'},

You requested to reset your password for your Ella Rises account.

Click the link below to reset your password. This link will expire in 1 hour.

${resetLink}

If you did not request this password reset, you can safely ignore this email.

— Ella Rises`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #be185d;">Ella Rises</h2>
      <p>Hi ${participant.ParticipantFirstName || 'there'},</p>
      <p>You requested to reset your password for your Ella Rises account.</p>
      <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
      <p style="margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #be185d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #666; font-size: 14px; word-break: break-all;">${resetLink}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">If you did not request this password reset, you can safely ignore this email.</p>
      <p style="color: #999; font-size: 12px;">— Ella Rises</p>
    </div>
  `;

  return sendEmail({ to: participant.ParticipantEmail, subject, text, html });
}
