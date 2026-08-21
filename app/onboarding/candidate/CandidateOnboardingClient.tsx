"use client";

import { useState } from "react";

import AuthShell from "@/components/auth-shell";
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
    <AuthShell
      size="wide"
      badge="Final step"
      title="Set up your practice workspace"
      subtitle="A focused, distraction-free environment for practising interviews. Nothing here is shared with any employer."
    >
      <form action={submitCandidateOnboarding}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          Candidate information
        </p>

        <div className="grid grid-cols-2 gap-3">
          <input name="first_name" placeholder="First name" required className={inputClass} />
          <input name="last_name" placeholder="Last name" required className={inputClass} />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email address"
          required
          className={`${inputClass} mt-3`}
        />

        <div className="mt-3 grid grid-cols-[96px_1fr] gap-3">
          <input name="country_code" defaultValue="+91" className={inputClass} />
          <input name="phone" placeholder="Phone number" required className={inputClass} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <select name="primary_role_id" required className={inputClass}>
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.role_pool_id} value={r.role_pool_id}>
                {r.canonical_name}
              </option>
            ))}
          </select>

          <select name="experience_level_code" required className={inputClass}>
            <option value="">Select experience</option>
            {experienceLevels.map((e) => (
              <option key={e.code} value={e.code}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setSkillsOpen(true)}
          className={`${inputClass} mt-3 text-left ${selectedSkills.length === 0 ? "text-ink-muted" : "text-ink-strong"} hover:border-brand-300`}
        >
          {selectedSkills.length === 0
            ? "Select primary skills"
            : `${selectedSkills.length} skills selected`}
        </button>

        {selectedSkills.map((id) => (
          <input key={id} type="hidden" name="primary_skill_ids" value={id} />
        ))}

        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Continue
        </button>
      </form>

      {skillsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,22,38,0.55)] p-4">
          <div className="w-full max-w-lg rounded-[20px] border border-line bg-surface p-6 shadow-lg">
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

            <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto">
              {skills.map((s) => (
                <label
                  key={s.skill_id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink transition hover:border-brand-300 hover:bg-surface-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(s.skill_id)}
                    onChange={() => toggleSkill(s.skill_id)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {s.canonical_name}
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSkillsOpen(false)}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
