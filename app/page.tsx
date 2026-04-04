import { redirect } from "next/navigation";

const authAppUrl = process.env.AUTH_APP_URL || "https://auth.hireveri.com";

export default function Home() {
  redirect(`${authAppUrl}/recruiter-access`);
}
