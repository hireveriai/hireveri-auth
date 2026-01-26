import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendOtpEmail(to: string, otp: string) {
  // Gate: do nothing if SMTP not configured
  if (!process.env.SMTP_HOST) return;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
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
