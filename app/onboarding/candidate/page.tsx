import CandidateOnboardingClient from "./CandidateOnboardingClient";
import { pool } from "@/lib/db-admin";

export default async function CandidateOnboardingPage() {
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
