import nodemailer from "nodemailer";

/**
 * Get Gmail transporter if credentials are configured
 * @returns {nodemailer.Transporter|null} Transporter instance or null if not configured
 */
export const getEmailTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
};

/**
 * Check if email service is configured
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
};

/**
 * Send email using Gmail
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} options.replyTo - Reply-to email (optional)
 * @returns {Promise<void>}
 */
export const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  const transporter = getEmailTransporter();

  if (!transporter) {
    throw new Error("Email service not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file");
  }

  const gmailUser = process.env.GMAIL_USER;

  const mailOptions = {
    from: gmailUser,
    to: to || gmailUser, // Default to sending to yourself
    replyTo: replyTo || gmailUser,
    subject,
    html,
    text,
  };

  await transporter.sendMail(mailOptions);
};

