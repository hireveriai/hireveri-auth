import { NextResponse } from "next/server";
import { hireVeriCountries } from "@/lib/pools/countries";

export async function GET() {
  return NextResponse.json(hireVeriCountries);
}
