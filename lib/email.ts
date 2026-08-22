import nodemailer from "nodemailer";

const defaultFrom = "VerisNova <no-reply@mail.verisnova.com>";
const resendApiUrl = "https://api.resend.com/emails";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
};

export class OtpEmailDeliveryError extends Error {
  public readonly publicMessage: string;

  constructor(message: string, publicMessage = "Email delivery failed. Please try again.") {
    super(message);
    this.name = "OtpEmailDeliveryError";
    this.publicMessage = publicMessage;
  }
}

export function isOtpEmailDeliveryError(error: unknown) {
  return error instanceof OtpEmailDeliveryError;
}

function getConfiguredFrom() {
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (emailFrom) {
    return emailFrom;
  }

  const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (resendFromEmail) {
    const resendFromName = process.env.RESEND_FROM_NAME?.trim() || "VerisNova";
    return `${resendFromName} <${resendFromEmail}>`;
  }

  const smtpFrom = process.env.SMTP_FROM?.trim();

  if (smtpFrom) {
    return smtpFrom;
  }

  return defaultFrom;
}

function getTransporter() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

async function sendViaResend(message: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return false;
  }

  const from = getConfiguredFrom();

  const res = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new OtpEmailDeliveryError(`Resend send failed: ${errorText}`);
  }

  return true;
}

export async function sendEmail(message: EmailMessage) {
  let resendError: unknown;
  let sentWithResend = false;

  try {
    sentWithResend = await sendViaResend(message);
  } catch (error) {
    resendError = error;
    console.warn("RESEND DELIVERY FAILED; falling back to SMTP if configured.", error);
  }

  if (sentWithResend) {
    return;
  }

  const transporter = getTransporter();

  if (!transporter) {
    if (resendError) {
      throw resendError;
    }

    if (process.env.NODE_ENV === "production") {
      throw new OtpEmailDeliveryError(
        "No email transport configured",
        "Email delivery is not configured. Please contact support."
      );
    }

    console.warn(
      "EMAIL DELIVERY SKIPPED: configure RESEND_API_KEY or SMTP_HOST to send emails."
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: getConfiguredFrom(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    throw new OtpEmailDeliveryError(
      `SMTP send failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function sendOtpEmail(to: string, otp: string) {
  await sendEmail({
    to,
    subject: "Your VerisNova OTP",
    text: `Your VerisNova OTP is ${otp}. It is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif">
        <h2>VerisNova Login</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:4px">${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
      </div>
    `,
  });
}
