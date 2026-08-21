import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-admin";
import { fallbackCountries } from "@/lib/pools/fallback-pools";

/**
 * hireveri_countries is the one pool table with quoted camelCase columns
 * ("isActive", "sortOrder", …). Unquoted snake_case names fail to resolve
 * against it, which silently sent every request to the 20-country fallback.
 */
const COUNTRIES_QUERY = `
  select
    name,
    "isoCode" as "isoCode",
    "phoneCode" as "phoneCode"
  from public.hireveri_countries
  where "isActive" = true
  order by "isDefault" desc, "sortOrder" asc, name asc
`;

/** The table stores no flag, so derive it from the ISO 3166-1 alpha-2 code. */
function isoToFlag(isoCode: string) {
  const code = isoCode?.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code ?? "")) {
    return "🌐";
  }

  return String.fromCodePoint(
    ...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  );
}

export async function GET() {
  try {
    const pool = getPool();
    const { rows } = await pool.query<{
      name: string;
      isoCode: string;
      phoneCode: string;
    }>(COUNTRIES_QUERY);

    if (rows.length) {
      return NextResponse.json(
        rows.map((row) => ({ ...row, flag: isoToFlag(row.isoCode) }))
      );
    }
  } catch (error) {
    console.warn("POOL COUNTRIES FALLBACK:", error);
  }

  return NextResponse.json(fallbackCountries);
}
