export async function sendEmail({ to, subject, html, text }) {
  // Email sending is disabled; just log so you can copy the link in dev.
  console.log('📧 [EMAIL DISABLED] Would send email:', {
    to,
    subject,
    text,
    html,
  });

  // Pretend success so callers continue as normal.
  return { messageId: 'dev-mock-message-id' };
}


