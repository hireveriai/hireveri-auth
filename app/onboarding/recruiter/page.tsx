"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const recruiterAppUrl =
  process.env.NEXT_PUBLIC_RECRUITER_APP_URL ||
  "https://recruiter.verihireai.work";

export default function RecruiterOnboardingPage() {
  const router = useRouter();

  /* ---------------- Identity (from session) ---------------- */
  const [email, setEmail] = useState<string>("");
  const [emailLoading, setEmailLoading] = useState(true);

  useEffect(() => {
    async function loadEmail() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        const data = await res.json();
        setEmail(data.email);
      } catch {
        // session missing / expired → go back to login
        router.replace("/recruiter-access");
      } finally {
        setEmailLoading(false);
      }
    }

    loadEmail();
  }, [router]);

  /* ---------------- Form State ---------------- */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [recruiterRole, setRecruiterRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- Submit Handler ---------------- */
  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !firstName || !lastName || !companyName) {
      setError("Please fill all required fields.");
      return;
    }

    setError(null);
    setLoading(true);

    // TODO: replace with real API call
    const res = await fetch("/api/onboarding/recruiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        companyName,
        recruiterRole,
        industry,
        country,
        companySize,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data?.error || "Failed to create workspace");
      setLoading(false);
      return;
    }

    window.location.href = recruiterAppUrl;

  }

  /* ---------------- Render ---------------- */
  return (
    <main className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),_transparent_60%)]">
      {/* Header */}
      <header className="flex items-center gap-3 px-10 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 font-semibold">
          HV
        </div>
        <span className="text-lg font-semibold text-white">HireVeri</span>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-10 py-10">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          {/* LEFT PANEL */}
          <section className="flex flex-col justify-start">
            <div className="mb-10 h-[220px] rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40">
              Recruiter workspace visual
            </div>

            <h2 className="text-3xl font-semibold text-white mb-4">
              Configure your hiring workspace
            </h2>

            <p className="text-white/70 max-w-md mb-6">
              We’ll use this information to set up a secure, global-ready
              environment for conducting and evaluating interviews.
            </p>

            <ul className="space-y-2 text-white/65 text-sm">
              <li>• Your recruiter profile</li>
              <li>• Your company hiring workspace</li>
              <li>• Secure interview & evaluation access</li>
            </ul>

            <p className="mt-6 text-xs text-white/40">
              Secure onboarding · Global-ready · Enterprise-grade
            </p>
          </section>

          {/* RIGHT PANEL */}
          <section>
            <form
              onSubmit={handleCreateWorkspace}
              className="
                w-full max-w-lg
                min-h-[640px]
                rounded-2xl p-8
                bg-gradient-to-b from-[#0F1F2A]/90 to-[#0A1016]/90
                border border-cyan-400/20
                shadow-[0_0_60px_rgba(34,211,238,0.12)]
              "
            >
              <h3 className="text-2xl font-semibold text-white mb-1">
                Set up your recruiter profile
              </h3>
              <p className="text-sm text-white/60 mb-6">
                This information helps us configure your hiring workspace.
              </p>

              {/* PERSONAL */}
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide text-white/50 mb-3">
                  Personal information
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-white/60">
                      First name <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      className="input mt-1"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/60">
                      Last name <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      className="input mt-1"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                {/* ✅ EMAIL FROM SESSION */}
                <div className="mb-4">
                  <label className="text-xs text-white/60">Work email</label>
                  <input
                    className="input mt-1 opacity-60 cursor-not-allowed"
                    value={emailLoading ? "Loading…" : email}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-[90px_1fr] gap-3">
                  <input className="input text-center" value="+91" disabled />
                  <input
                    className="input"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* ORG */}
              <div className="mb-8">
                <p className="text-xs uppercase tracking-wide text-white/50 mb-3">
                  Organization information
                </p>

                <div className="mb-4">
                  <label className="text-xs text-white/60">
                    Company name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    className="input mt-1"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="input"
                    value={recruiterRole}
                    onChange={(e) => setRecruiterRole(e.target.value)}
                  >
                    <option value="">Recruiter role</option>
                    <option>HR</option>
                    <option>Founder / CEO</option>
                    <option>Hiring Manager</option>
                  </select>

                  <select
                    className="input"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Industry</option>
                    <option>Finance</option>
                    <option>Manufacturing</option>
                    <option>Technology</option>
                  </select>

                  <select
                    className="input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="">Country</option>
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                  </select>

                  <select
                    className="input"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                  >
                    <option value="">Company size</option>
                    <option>1–10</option>
                    <option>11–50</option>
                    <option>51–200</option>
                    <option>201–1000</option>
                    <option>1000+</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 mb-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || emailLoading}
                className="w-full rounded-xl bg-cyan-500 py-3 text-black font-semibold hover:bg-cyan-400 disabled:opacity-50 transition"
              >
                {loading ? "Creating Workspace..." : "Create Hiring Workspace"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
