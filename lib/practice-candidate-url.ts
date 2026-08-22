// Canonical host flipped for the VerisNova rebrand: the public candidate app
// is now candidate.verisnova.com. candidate-practice.* was the old canonical
// host and moves into the legacy set, so any stored or configured URL still
// pointing at it is rewritten forward rather than 404ing.
const DEFAULT_PRACTICE_CANDIDATE_APP_URL =
  "https://candidate.verisnova.com";

const LEGACY_PRACTICE_CANDIDATE_HOSTS = new Set([
  "candidate-practice.verisnova.com",
  "www.candidate.verisnova.com",
  "candidate-practice.verihireai.work",
  "candidate.verihireai.work",
  "www.candidate.verihireai.work",
]);

export function normalizePracticeCandidateUrl(value?: string | null) {
  const raw = value?.trim() || DEFAULT_PRACTICE_CANDIDATE_APP_URL;

  try {
    const url = new URL(raw);

    if (LEGACY_PRACTICE_CANDIDATE_HOSTS.has(url.hostname)) {
      url.protocol = "https:";
      url.hostname = "candidate.verisnova.com";
    }

    return url.toString();
  } catch {
    return DEFAULT_PRACTICE_CANDIDATE_APP_URL;
  }
}

export function getPracticeCandidateAppUrl() {
  return normalizePracticeCandidateUrl(
    process.env.PRACTICE_CANDIDATE_APP_URL ||
      process.env.CANDIDATE_APP_URL ||
      DEFAULT_PRACTICE_CANDIDATE_APP_URL
  ).replace(/\/$/, "");
}

export function getPracticeCandidateDashboardUrl() {
  if (process.env.PRACTICE_CANDIDATE_DASHBOARD_URL) {
    return normalizePracticeCandidateUrl(
      process.env.PRACTICE_CANDIDATE_DASHBOARD_URL
    );
  }

  return getPracticeCandidateAppUrl();
}
