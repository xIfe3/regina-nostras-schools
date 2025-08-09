import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
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

    // Email template for contact form submission
    const contactEmailTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .field-group {
            margin-bottom: 25px;
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            border-radius: 5px;
          }
          .field-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 8px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .field-value {
            font-size: 16px;
            color: #333;
            word-wrap: break-word;
          }
          .message-box {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            font-style: italic;
            line-height: 1.8;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          .priority-badge {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📧 New Contact Form Submission</h1>
          <p>Regina Nostra Schools Website</p>
        </div>

        <div class="content">
          <div class="priority-badge">🔔 New Inquiry</div>

          <div class="field-group">
            <div class="field-label">Full Name</div>
            <div class="field-value">${name}</div>
          </div>

          <div class="field-group">
            <div class="field-label">Email Address</div>
            <div class="field-value">
              <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
            </div>
          </div>

          <div class="field-group">
            <div class="field-label">Message</div>
            <div class="field-value">
              <div class="message-box">"${message}"</div>
            </div>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h3 style="margin: 0 0 10px 0; color: #1565c0;">📋 Next Steps:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1565c0;">
              <li>Reply to this inquiry within 24 hours</li>
              <li>Use the provided email address to respond directly</li>
              <li>Consider the inquiry type and route to appropriate department</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>This email was automatically generated from the Regina Nostra Schools website contact form.</p>
          <p>
            <a href="mailto:reginanostraschools@gmail.com">reginanostraschools@gmail.com</a> |
            <a href="tel:+234-703-926-5542">+234-703-926-5542</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Regina Nostra Schools. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email to school admin
    await sendEmail({
      to: process.env.EMAIL_FROM || "reginanostraschools@gmail.com",
      subject: `🔔 New Contact Form Submission from ${name}`,
      html: contactEmailTemplate,
    });

    // Send confirmation email to the person who submitted the form
    const confirmationTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting Regina Nostra Schools</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .logo {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .welcome-message {
            background: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .contact-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏫</div>
          <h1>Thank You for Contacting Us!</h1>
          <p>Regina Nostra Schools</p>
        </div>

        <div class="content">
          <h2>Dear ${name},</h2>

          <div class="welcome-message">
            <h3>✅ Your message has been received!</h3>
            <p>Thank you for reaching out to Regina Nostra Schools. We appreciate your interest in our institution and will respond to your inquiry within 24 hours.</p>
          </div>

          <h3>📝 Your Message Summary:</h3>
          <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-style: italic;">
            "${message}"
          </p>

          <div class="contact-info">
            <h3>📞 Need Immediate Assistance?</h3>
            <p><strong>Phone:</strong> 07039265542, 09157736602</p>
            <p><strong>Email:</strong> reginanostraschools@gmail.com</p>
            <p><strong>Address:</strong> 12 Clements Nnakwe Close, Ugbene, Abakpa, Enugu, Nigeria</p>
            <p><strong>Office Hours:</strong> Monday - Friday: 8:00 AM - 5:00 PM WAT</p>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">🌟 About Regina Nostra Schools</h3>
            <p style="color: #856404; margin-bottom: 0;">
              <em>"Inspirando Excellentiam"</em> - We are committed to inspiring excellence in education,
              character development, and preparing students for a successful future.
            </p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply to this message.</p>
          <p>Follow us on social media for updates and school news!</p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Regina Nostra Schools. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: "✅ Thank you for contacting Regina Nostra Schools",
      html: confirmationTemplate,
    });

    console.log(`Contact form email sent successfully from ${name} (${email})`);
  } catch (error) {
    console.error("Contact email sending error:", error);
    throw new Error("Failed to send contact email");
  }
};
