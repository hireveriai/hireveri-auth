import { createHmac } from "crypto";

type RecruiterJwtPayload = {
  userId: string;
  orgId: string;
  role: "recruiter";
  email?: string;
};

type RecruiterUser = {
  id: string;
  org_id: string | null;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

function signJwt(payload: RecruiterJwtPayload) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", getJwtSecret())
    .update(signingInput)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

  return `${signingInput}.${signature}`;
}

export function signRecruiterJwt(user: RecruiterUser, email?: string) {
  if (!user.org_id) {
    throw new Error("Recruiter organization is missing");
  }

  return signJwt({
    userId: user.id,
    orgId: user.org_id,
    role: "recruiter",
    ...(email ? { email } : {}),
  });
}
