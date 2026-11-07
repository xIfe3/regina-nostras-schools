import nodemailer from "nodemailer";
import { contactConfirmationEmail, contactToSchoolEmail, toPlainText } from "./emailTemplates";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  /** Plain-text version; generated from the HTML when not given */
  text?: string;
  replyTo?: string;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: options.from || process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || toPlainText(options.html),
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
};

export interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

export const sendContactEmail = async (
  contactData: ContactEmailData
): Promise<void> => {
  try {
    const { name, email, message } = contactData;

    // To the school office (reply goes straight to the person who wrote)
    await sendEmail({
      to: process.env.EMAIL_FROM || "reginanostraschools@gmail.com",
      replyTo: email,
      ...(await contactToSchoolEmail({ name, email, message })),
    });

    // Confirmation to the person who submitted the form
    await sendEmail({
      to: email,
      ...(await contactConfirmationEmail({ name, message })),
    });

    console.log(`Contact form email sent successfully from ${name} (${email})`);
  } catch (error) {
    console.error("Contact email sending error:", error);
    throw new Error("Failed to send contact email");
  }
};
