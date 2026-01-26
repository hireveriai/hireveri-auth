import { NextResponse } from "next/server";
import { requestOTP } from "@/lib/otp/otp.service";

export async function POST(req: Request) {
  try {
    const { email, intent = "recruiter" } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await requestOTP({
      email,
      intent,
      purpose: "LOGIN"
    });

    return NextResponse.json({
      success: true,
      identityId: result.identityId, // ✅ CRITICAL FIX
      otpId: result.otpId,
      expiresIn: result.expiresIn
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send OTP" },
      { status: 400 }
    );
  }
}
