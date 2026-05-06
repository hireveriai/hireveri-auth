import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireVeri Auth",
  description: "Secure OTP-based access for recruiter and practice candidate sign-in.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: ["/icon.svg"],
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
