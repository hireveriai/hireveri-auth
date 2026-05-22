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

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");

    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function verifyHs256Jwt(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  const signature = createHmac("sha256", getJwtSecret())
    .update(`${parts[0]}.${parts[1]}`)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

  return signature === parts[2];
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

export function verifyRecruiterJwt(token: string): RecruiterJwtPayload | null {
  if (!verifyHs256Jwt(token)) {
    return null;
  }

  const payload = decodeBase64Url(token.split(".")[1]);

  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(payload) as RecruiterJwtPayload;

    if (
      claims.role !== "recruiter" ||
      !claims.userId ||
      !claims.orgId
    ) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}
