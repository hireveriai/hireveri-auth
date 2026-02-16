// app/practice/page.tsx

import Link from "next/link";

export default function PracticeEntryPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0E13] text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11151C] p-8">
        <h1 className="text-2xl font-semibold mb-2">
          Practice Mock Interviews
        </h1>

        <p className="text-sm text-white/60 mb-6">
          Practice technical and behavioral interviews in a calm,
          AI-guided environment. No recruiters. No pressure.
        </p>

        <ul className="mb-6 space-y-2 text-sm text-white/70">
          <li>• Real interview-style questions</li>
          <li>• Structured, distraction-free calm room</li>
          <li>• Designed for skill improvement</li>
        </ul>

        <Link
          href="/verify-otp?intent=candidate_practice"
          className="block w-full text-center rounded-lg bg-indigo-600 py-2 text-sm font-medium hover:bg-indigo-500 transition"
        >
          Start Practice Interview
        </Link>

        <p className="mt-4 text-xs text-white/40 text-center">
          You’ll verify your email with a one-time code.
        </p>
      </div>
    </div>
  );
}
