import { createServerClient } from "@/lib/db";

const SESSION_TTL_HOURS = 24;

export async function createSession(params: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { userId, ipAddress, userAgent } = params;

  const supabase = await createServerClient();

  const expiresAt = new Date(
    Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
  );

  const { data, error } = await supabase
    .from("auth_sessions")
    .insert([
      {
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress ?? null,
        user_agent: userAgent ?? null,
        is_active: true,
      },
    ])
    .select("session_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    sessionId: data.session_id,
    expiresAt,
  };
}
