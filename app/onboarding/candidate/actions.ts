"use server";

import { redirect } from "next/navigation";
import { getPool } from "@/lib/db-admin";
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

  redirect("/practice/dashboard");
}
