import nodemailer from "nodemailer";

const defaultFrom = "HireVeri <no-reply@mil.hireveri.com>";
const resendApiUrl = "https://api.resend.com/emails";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendViaResend(to: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "no-reply@mail.hireveri.com";
  const fromName = process.env.RESEND_FROM_NAME || "HireVeri";
  const from = `${fromName} <${fromEmail}>`;

  const res = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your HireVeri OTP",
      text: `Your HireVeri OTP is ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>HireVeri Login</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:4px">${otp}</h1>
          <p>This code is valid for 5 minutes.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Resend send failed: ${errorText}`);
  }

  return true;
}

export async function sendOtpEmail(to: string, otp: string) {
  const sentWithResend = await sendViaResend(to, otp);

  if (sentWithResend) {
    return;
  }

  // Gate: do nothing if SMTP not configured
  if (!process.env.SMTP_HOST) return;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || defaultFrom,
    to,
    subject: "Your HireVeri OTP",
    text: `Your HireVeri OTP is ${otp}. It is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif">
        <h2>HireVeri Login</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing:4px">${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
      </div>
    `
  });
}
