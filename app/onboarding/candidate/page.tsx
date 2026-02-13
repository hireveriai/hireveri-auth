export const dynamic = "force-dynamic";

import CandidateOnboardingClient from "./CandidateOnboardingClient";
import { getPool } from "@/lib/db-admin";

export default async function CandidateOnboardingPage() {
  const pool = getPool();

  const { rows } = await pool.query(
    `select sp_get_practice_candidate_onboarding_pools() as data`
  );

  const data = rows[0].data;

  return (
    <CandidateOnboardingClient
      roles={data.roles ?? []}
      experienceLevels={data.experience_levels ?? []}
      skills={data.skills ?? []}
    />
  );
}
