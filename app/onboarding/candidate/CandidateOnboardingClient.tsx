"use client";

import { useState } from "react";
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

  const inputClass =
    "w-full rounded-lg bg-[#0b1218] border border-neutral-700 px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-neutral-500";

  return (
    <main className="relative min-h-screen bg-[#0b1218] text-neutral-100">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1218] via-[#0e1a22] to-[#0b1218]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-8 grid grid-cols-1 gap-16 lg:grid-cols-2">
        {/* LEFT */}
        <section className="pt-6">
          <div className="mb-10 h-48 rounded-2xl bg-gradient-to-br from-[#0f1c24] via-[#0c1820] to-[#0f1c24] ring-1 ring-white/5 flex items-center justify-center">
            <span className="text-sm text-neutral-500">
              Candidate workspace visual
            </span>
          </div>

          <h1 className="text-4xl font-semibold mb-6">
            Set up your practice workspace
          </h1>

          <p className="text-neutral-300 mb-8 max-w-xl">
            We’ll configure a focused, distraction-free environment for
            practicing technical interviews.
          </p>

          <ul className="text-sm text-neutral-400 space-y-2">
            <li>• Your candidate profile</li>
            <li>• Skill-specific interview configuration</li>
            <li>• Secure, private practice sessions</li>
          </ul>

          <p className="mt-10 text-xs text-neutral-500">
            Secure onboarding · Practice-only · No recruiter visibility
          </p>
        </section>

        {/* RIGHT */}
        <section className="bg-[#0f1c24] rounded-2xl p-10 ring-1 ring-white/5">
          <form action={submitCandidateOnboarding} className="space-y-6">
            <h2 className="text-lg font-medium">Candidate information</h2>

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
                className="w-24 rounded-lg bg-[#0b1218] border border-neutral-700 px-3 py-2.5 text-sm"
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
              className="w-full rounded-lg bg-[#0b1218] border border-neutral-700 px-4 py-2.5 text-left text-sm text-neutral-300 hover:border-neutral-500"
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
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 py-3 text-sm font-medium"
            >
              Continue
            </button>
          </form>
        </section>
      </div>

      {/* MODAL */}
      {skillsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#0f1c24] w-full max-w-lg rounded-2xl p-6 ring-1 ring-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select primary skills</h3>
              <button onClick={() => setSkillsOpen(false)}>✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {skills.map((s) => (
                <label
                  key={s.skill_id}
                  className="flex items-center gap-2 border border-neutral-700 rounded-md px-3 py-2 text-sm cursor-pointer hover:border-neutral-500"
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
                className="bg-blue-600 hover:bg-blue-500 rounded-lg px-5 py-2 text-sm"
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
