const DEFAULT_PRACTICE_CANDIDATE_APP_URL =
  "https://candidate-practice.hireveri.com";

const LEGACY_PRACTICE_CANDIDATE_HOSTS = new Set([
  "candidate.hireveri.com",
  "www.candidate.hireveri.com",
  "candidate.verihireai.work",
  "www.candidate.verihireai.work",
]);

export function normalizePracticeCandidateUrl(value?: string | null) {
  const raw = value?.trim() || DEFAULT_PRACTICE_CANDIDATE_APP_URL;

  try {
    const url = new URL(raw);

    if (LEGACY_PRACTICE_CANDIDATE_HOSTS.has(url.hostname)) {
      url.protocol = "https:";
      url.hostname = "candidate-practice.hireveri.com";
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

  return new URL("/dashboard", getPracticeCandidateAppUrl()).toString();
}
