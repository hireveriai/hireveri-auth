import { redirect } from "next/navigation";
import { getRecruiterAccessUrl } from "@/lib/app-urls";

export default function Home() {
  redirect(
    getRecruiterAccessUrl(
      process.env.RECRUITER_AUTH_APP_URL || process.env.AUTH_APP_URL
    )
  );
}
