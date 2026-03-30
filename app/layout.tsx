import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireVeri Auth",
  description: "Secure OTP-based access for recruiter and practice candidate sign-in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
