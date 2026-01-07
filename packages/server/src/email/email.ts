import nodemailer from "nodemailer";

// Nodemailer docs recommend reusing a single transporter instance
//
// > Create the transporter once and reuse it.
// > Transporter creation opens network sockets and performs authentication;
// > doing this for every email adds needless overhead.
//
// https://nodemailer.com/usage#create-a-transporter
let transporter: nodemailer.Transporter | null = null;

function initializeTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASSWORD || "";

  // Validate required configuration
  if (!host || !user || !pass) {
    throw new Error(
      "Missing required email configuration. Please check SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.",
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

/**
 * Send an email via SMTP.
 *
 * @param subject - The email subject line
 * @param to - The recipient's email address
 * @param text - The email message body in plain text format
 * @param html - Optional HTML version of the message (for email clients that support HTML)
 * @returns Promise that resolves when the email is sent
 * @throws Error if email configuration is missing or if sending fails
 */
export async function sendEmail(
  subject: string,
  to: string,
  text: string,
  html?: string,
): Promise<void> {
  const transporter = initializeTransporter();
  const from = process.env.SMTP_FROM || "";

  try {
    await transporter.sendMail({
      from: from,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error(
      `Failed to send email: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
