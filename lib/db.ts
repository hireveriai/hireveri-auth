// lib/db.ts
import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";

/**
 * Session-aware Supabase client (SERVER)
 * -------------------------------------
 * - Uses ANON key (correct)
 * - Reads/writes auth cookies
 * - REQUIRED for auth.getUser()
 * - Compatible with Next.js async cookies()
 */
export async function createServerClient() {
  const cookieStore = await cookies(); // ✅ MUST await

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },

        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },

        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
