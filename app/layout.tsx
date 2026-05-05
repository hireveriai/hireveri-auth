import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireVeri Auth",
  description: "Secure OTP-based access for recruiter and practice candidate sign-in.",
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: ["/icon"],
    apple: ["/icon"],
  },
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
