const PRODUCTION_RECRUITER_AUTH_ORIGIN = "https://auth.hireveri.com";
const PRODUCTION_PRACTICE_AUTH_ORIGIN = "https://auth.hireveri.com";

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.hostname === "www.auth.hireveri.com") {
      url.hostname = "auth.hireveri.com";
    }

    if (url.hostname === "www.auth.verihireai.work") {
      url.hostname = "auth.verihireai.work";
    }

    return url.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string) {
  const { hostname } = new URL(origin);

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0"
  );
}

function resolveOrigin(configuredOrigin: string | undefined | null, fallback: string) {
  const normalizedOrigin = normalizeOrigin(configuredOrigin);

  if (!normalizedOrigin) {
    return fallback;
  }

  if (process.env.NODE_ENV === "production" && isLocalOrigin(normalizedOrigin)) {
    return fallback;
  }

  return normalizedOrigin;
}

export function getRecruiterAuthOrigin(configuredOrigin?: string | null) {
  return resolveOrigin(configuredOrigin, PRODUCTION_RECRUITER_AUTH_ORIGIN);
}

export function getPracticeAuthOrigin(configuredOrigin?: string | null) {
  return resolveOrigin(configuredOrigin, PRODUCTION_PRACTICE_AUTH_ORIGIN);
}

export function buildAppUrl(origin: string, pathname: string) {
  return new URL(pathname, origin).toString();
}

export function getRecruiterAccessUrl(configuredOrigin?: string | null) {
  return buildAppUrl(getRecruiterAuthOrigin(configuredOrigin), "/recruiter-access");
}

export function getRecruiterOnboardingUrl(configuredOrigin?: string | null) {
  return buildAppUrl(
    getRecruiterAuthOrigin(configuredOrigin),
    "/onboarding/recruiter"
  );
}

export function getPracticeEntryUrl(configuredOrigin?: string | null) {
  return buildAppUrl(getPracticeAuthOrigin(configuredOrigin), "/practice");
}

export function getPracticeAccessUrl(configuredOrigin?: string | null) {
  return buildAppUrl(getPracticeAuthOrigin(configuredOrigin), "/practice-access");
}

export function getCandidateOnboardingUrl(configuredOrigin?: string | null) {
  return buildAppUrl(
    getPracticeAuthOrigin(configuredOrigin),
    "/onboarding/candidate"
  );
}
