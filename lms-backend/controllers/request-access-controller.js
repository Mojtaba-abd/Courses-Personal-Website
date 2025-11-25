import requestAccessModel from "../models/request-access-model.js";
import { sendEmail, isEmailConfigured } from "../utils/email-service.js";

export const createRequestAccess = async (req, res) => {
  try {
    const { name, email, phone, message, courseId, courseTitle } = req.body;

    if (!name || !email || !courseId || !courseTitle) {
      return res.status(400).json({ error: "Name, email, courseId, and courseTitle are required" });
    }

    // Save to database
    const request = await requestAccessModel.create({
      name,
      email,
      phone: phone || "",
      message: message || "",
      courseId,
      courseTitle,
      status: "pending",
    });

    // Optionally send email notification (non-critical - don't fail if email fails)
    if (isEmailConfigured()) {
      try {
        await sendEmail({
          to: process.env.GMAIL_USER,
          replyTo: email,
          subject: `New Course Access Request: ${courseTitle}`,
          html: `
            <h2>New Course Access Request</h2>
            <p><strong>Course:</strong> ${courseTitle}</p>
            <p><strong>Course ID:</strong> ${courseId}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Message:</strong></p>
            <p>${message ? message.replace(/\n/g, "<br>") : "No message provided"}</p>
            <hr>
            <p><small>Request ID: ${request._id}</small></p>
          `,
          text: `
            New Course Access Request
            
            Course: ${courseTitle}
            Course ID: ${courseId}
            Name: ${name}
            Email: ${email}
            Phone: ${phone || "Not provided"}
            Message: ${message || "No message provided"}
            
            Request ID: ${request._id}
          `,
        });
      } catch (emailError) {
        console.error("Email sending error (non-critical):", emailError);
        // Don't fail the request if email fails - request is already saved to DB
      }
    } else {
      console.log("Email service not configured - skipping email notification");
    }

    res.status(201).json({
      message: "Request submitted successfully",
      request: {
        _id: request._id,
        name: request.name,
        email: request.email,
        courseTitle: request.courseTitle,
      },
    });
  } catch (error) {
    console.error("Request access error:", error);
    res.status(500).json({ error: error.message || "Failed to submit request" });
  }
};

