import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the email transporter with environment variables.
 * This is called automatically when sending an email.
 */
function initializeTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const config: EmailConfig = {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.SMTP_FROM || "",
  };

  // Validate required configuration
  if (!config.host || !config.user || !config.password || !config.from) {
    throw new Error(
      "Missing required email configuration. Please check SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM environment variables.",
    );
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  return transporter;
}

/**
 * Send an email via SMTP.
 *
 * @param subject - The email subject line
 * @param to - The recipient's email address
 * @param message - The email message body (plain text or HTML)
 * @returns Promise that resolves when the email is sent
 * @throws Error if email configuration is missing or if sending fails
 */
export async function sendEmail(
  subject: string,
  to: string,
  message: string,
): Promise<void> {
  const transporter = initializeTransporter();
  const from = process.env.SMTP_FROM || "";

  try {
    await transporter.sendMail({
      from: from,
      to: to,
      subject: subject,
      text: message,
      html: message, // Send as both text and HTML
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
