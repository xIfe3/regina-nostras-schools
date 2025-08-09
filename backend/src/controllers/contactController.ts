import { Request, Response } from "express";
import { sendContactEmail } from "../utils/email.js";
import ActivityLogger from "../utils/activityLogger.js";

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

// @desc    Send contact form message
// @route   POST /api/contact
// @access  Public
export const sendContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, message }: ContactRequest = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate message length
    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters long",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message must be less than 1000 characters",
      });
    }

    // Send contact email
    await sendContactEmail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    });

    // Log the contact form submission
    await ActivityLogger.log(
      "system", // Use system as user ID for public contact forms
      {
        type: "contact_form",
        title: "Contact Form Submission",
        description: `Contact form submitted by ${name} (${email})`,
        metadata: {
          contactName: name,
          contactEmail: email,
          messageLength: message.length,
        },
      },
      req
    );

    res.status(200).json({
      success: true,
      message:
        "Thank you for contacting us! We'll get back to you within 24 hours.",
    });
  } catch (error) {
    console.error("Contact form error:", error);

    // Log the error
    await ActivityLogger.log(
      "system",
      {
        type: "system_error",
        title: "Contact Form Error",
        description: `Contact form submission failed: ${
          (error as Error).message
        }`,
        metadata: {
          errorType: "contact_form_error",
          userIP: req.ip,
        },
      },
      req
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to send message. Please try again later or contact us directly.",
    });
  }
};
