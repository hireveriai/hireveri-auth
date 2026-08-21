"use client";

import { useState } from "react";

import BrandLogo from "@/components/brand-logo";
import { submitCandidateOnboarding } from "./actions";

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */

type Role = {
  role_pool_id: string;
  canonical_name: string;
};

type ExperienceLevel = {
  code: string;
  label: string;
};

type Skill = {
  skill_id: string;
  canonical_name: string;
};

type Props = {
  roles: Role[];
  experienceLevels: ExperienceLevel[];
  skills: Skill[];
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function CandidateOnboardingClient({
  roles,
  experienceLevels,
  skills,
}: Props) {
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const inputClass = "input";

  return (
    <main className="relative min-h-screen bg-surface-1 text-ink-strong">
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-8">
        <div className="mb-10">
          <BrandLogo priority />
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        {/* LEFT */}
        <section>
          <div className="mb-10 flex h-48 items-center justify-center rounded-[24px] border border-line bg-navy">
            <span className="text-sm text-ink-inv-muted">
              Candidate workspace visual
            </span>
          </div>

          <span className="mb-4 inline-flex w-fit rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
            Final step
          </span>

          <h1 className="text-4xl font-semibold mb-6">
            Set up your practice workspace
          </h1>

          <p className="mb-8 max-w-xl text-ink-muted">
            We’ll configure a focused, distraction-free environment for
            practicing technical interviews.
          </p>

          <ul className="space-y-2 text-sm text-ink-muted">
            <li>• Your candidate profile</li>
            <li>• Skill-specific interview configuration</li>
            <li>• Secure, private practice sessions</li>
          </ul>

          <p className="mt-10 text-xs text-ink-muted">
            Secure onboarding · Practice-only · No recruiter visibility
          </p>
        </section>

        {/* RIGHT */}
        <section className="rounded-[24px] border border-line bg-surface p-8 shadow-lg sm:p-10">
          <form action={submitCandidateOnboarding} className="space-y-6">
            <h2 className="text-lg font-semibold text-ink-strong">Candidate information</h2>

            <div className="grid grid-cols-2 gap-4">
              <input name="first_name" placeholder="First name" required className={inputClass} />
              <input name="last_name" placeholder="Last name" required className={inputClass} />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              className={inputClass}
            />

            <div className="flex gap-3">
              <input
                name="country_code"
                defaultValue="+91"
                className="input w-24"
              />
              <input name="phone" placeholder="Phone number" required className={inputClass} />
            </div>

            {/* Role */}
            <select name="primary_role_id" required className={inputClass}>
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.role_pool_id} value={r.role_pool_id}>
                  {r.canonical_name}
                </option>
              ))}
            </select>

            {/* Experience */}
            <select name="experience_level_code" required className={inputClass}>
              <option value="">Select experience</option>
              {experienceLevels.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.label}
                </option>
              ))}
            </select>

            {/* Skills Trigger */}
            <button
              type="button"
              onClick={() => setSkillsOpen(true)}
              className="input text-left text-ink-muted hover:border-brand-300"
            >
              {selectedSkills.length === 0
                ? "Select primary skills"
                : `${selectedSkills.length} skills selected`}
            </button>

            {/* Hidden Inputs */}
            {selectedSkills.map((id) => (
              <input key={id} type="hidden" name="primary_skill_ids" value={id} />
            ))}

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Continue
            </button>
          </form>
        </section>
        </div>
      </div>

      {/* MODAL */}
      {skillsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,22,38,0.55)] p-4">
          <div className="w-full max-w-lg rounded-[24px] border border-line bg-surface p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink-strong">Select primary skills</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSkillsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-brand-300 hover:text-brand-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {skills.map((s) => (
                <label
                  key={s.skill_id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink transition hover:border-brand-300 hover:bg-surface-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(s.skill_id)}
                    onChange={() => toggleSkill(s.skill_id)}
                  />
                  {s.canonical_name}
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSkillsOpen(false)}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
