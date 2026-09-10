"use server";

import { redirect } from "next/navigation";
import { getPool } from "@/lib/db-admin";
import { sendWelcomeEmail } from "@/lib/emails/welcome";
import { getPracticeCandidateDashboardUrl } from "@/lib/practice-candidate-url";
import { requireSession } from "@/lib/session/requireSession";

export async function submitCandidateOnboarding(formData: FormData) {
  console.log("🔥 submitCandidateOnboarding HIT");

  const { identity_id } = await requireSession();

  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const primary_role_id = formData.get("primary_role_id") as string;
  const experience_level_code = formData.get("experience_level_code") as string;
  const skill_ids = formData.getAll("primary_skill_ids") as string[];

  const pool = getPool();
  await pool.query(
    `
    select sp_complete_practice_candidate_onboarding(
      $1, $2, $3, $4, $5, $6
    )
    `,
    [
      identity_id,
      first_name,
      last_name,
      primary_role_id,
      experience_level_code,
      skill_ids,
    ]
  );

  /* Practice welcome fires here rather than at candidate creation in
     verify-otp: sp_create_practice_candidate runs before onboarding and has no
     first name yet, and the account is not usable until this step completes.
     This is the practice-side equivalent of the recruiter's sp_onboard_recruiter
     point, so both audiences are mailed at the same stage of their own flow.

     identity_id comes from requireSession, so both the recipient address and
     the audience are resolved server-side - the form supplies the display name
     only. sendWelcomeEmail never throws and claims its own idempotency row, so
     a resubmitted form cannot send twice and a mail outage cannot stop the
     redirect below. */
  await sendWelcomeEmail({
    identityId: identity_id,
    audience: "practice_candidate",
    firstName: first_name,
  });

  redirect(getPracticeCandidateDashboardUrl());
}
