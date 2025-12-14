# Email Module

This module provides email sending functionality via SMTP.

## Setup

Configure the following environment variables in your deployment environment:

| Variable        | Required | Description                     | Example                  |
| --------------- | -------- | ------------------------------- | ------------------------ |
| `SMTP_HOST`     | Yes      | SMTP server hostname            | `smtp.mailgun.org`       |
| `SMTP_PORT`     | No       | SMTP server port (default: 587) | `587`                    |
| `SMTP_SECURE`   | No       | Use TLS/SSL (default: false)    | `false`                  |
| `SMTP_USER`     | Yes      | SMTP authentication username    | `your-email@gmail.com`   |
| `SMTP_PASSWORD` | Yes      | SMTP authentication password    | `your-app-password`      |
| `SMTP_FROM`     | Yes      | Default sender email address    | `noreply@govariants.com` |

## Usage

```typescript
import { sendEmail } from "./email/email";

// Send plain text email
try {
  await sendEmail(
    "Password Reset",
    "user@example.com",
    "Reset Your Password\n\nClick the link below to reset your password...",
  );
} catch (error) {
  console.error("Failed to send email:", error);
}

// Send email with both plain text and HTML versions
try {
  await sendEmail(
    "Password Reset",
    "user@example.com",
    "Reset Your Password\n\nClick the link below to reset your password...",
    "<h1>Reset Your Password</h1><p>Click the link below to reset your password...</p>",
  );
} catch (error) {
  console.error("Failed to send email:", error);
}
```
