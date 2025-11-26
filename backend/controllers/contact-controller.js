import { sendEmail, isEmailConfigured } from "../utils/email-service.js";

export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!isEmailConfigured()) {
      console.error("Gmail credentials not configured");
      return res.status(500).json({ error: "Email service not configured. Please configure GMAIL_USER and GMAIL_APP_PASSWORD in your .env file" });
    }

    await sendEmail({
      to: process.env.GMAIL_USER, // Send to yourself
      replyTo: email,
      subject: `Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
    });

    res.json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: error.message || "Failed to send message" });
  }
};

