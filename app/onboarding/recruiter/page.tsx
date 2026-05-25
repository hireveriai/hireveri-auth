"use client";

import { useEffect, useState } from "react";
import { getRecruiterAccessUrl } from "@/lib/app-urls";
import RecruiterVisualPreview from "@/components/RecruiterVisualPreview";
import SearchableSelect, {
  type SearchableSelectOption,
} from "@/components/searchable-select";
import PhoneInput, { type PhoneCountryOption } from "@/components/phone-input";

const recruiterAppUrl =
  process.env.NEXT_PUBLIC_RECRUITER_APP_URL ||
  "https://recruiter.hireveri.com";
const recruiterAppUrlTemplate =
  process.env.NEXT_PUBLIC_RECRUITER_APP_URL_TEMPLATE;
const recruiterAuthAccessUrl = getRecruiterAccessUrl(
  process.env.NEXT_PUBLIC_RECRUITER_AUTH_APP_URL ||
    process.env.NEXT_PUBLIC_AUTH_APP_URL
);

function getSafeRecruiterNextPath(value: string | null | undefined) {
  if (!value) {
    return "/";
  }

  try {
    const base = new URL(recruiterAppUrl);
    const parsed = new URL(value, base);

    if (parsed.origin !== base.origin) {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

function buildRecruiterAppUrl(params: {
  organizationId?: string | null;
  userId?: string | null;
  nextPath?: string | null;
}) {
  const { organizationId, userId } = params;
  const safeNextPath = getSafeRecruiterNextPath(params.nextPath);

  if (recruiterAppUrlTemplate && safeNextPath === "/") {
    const templatedUrl = recruiterAppUrlTemplate
      .replaceAll("{organizationId}", organizationId ?? "")
      .replaceAll("{userId}", userId ?? "");

    try {
      if (new URL(templatedUrl).origin === new URL(recruiterAppUrl).origin) {
        return templatedUrl;
      }
    } catch {
      // Fall back to the configured recruiter app below.
    }
  }

  const url = new URL(safeNextPath, recruiterAppUrl);

  if (organizationId) {
    url.searchParams.set("organizationId", organizationId);
  }

  if (userId) {
    url.searchParams.set("userId", userId);
  }

  return url.toString();
}

type IndustryOption = {
  id: string;
  name: string;
  sortOrder: number;
};

type RecruiterRoleOption = {
  id: string;
  name: string;
  sortOrder: number;
};

type CompanySizeOption = {
  id: string;
  label: string;
  min: number;
  max: number | null;
  sortOrder: number;
};

type PoolState<T> = {
  items: T[];
  loading: boolean;
  error: string | null;
};

function usePoolOptions<T>(url: string) {
  const [state, setState] = useState<PoolState<T>>({
    items: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setState({ items: [], loading: true, error: null });

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(url, { cache: "no-store" });
          const payload = await response.json().catch(() => null);

          if (!response.ok || !Array.isArray(payload)) {
            throw new Error(payload?.error || "Failed to load options");
          }

          if (cancelled) {
            return;
          }

          setState({
            items: payload,
            loading: false,
            error: null,
          });
          return;
        } catch {
          if (attempt === 0) {
            continue;
          }

          if (cancelled) {
            return;
          }

          setState({
            items: [],
            loading: false,
            error: "Failed to load options",
          });
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

export default function RecruiterOnboardingPage() {
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [recruiterRoleId, setRecruiterRoleId] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [companySizeId, setCompanySizeId] = useState("");
  const [selectedCountry, setSelectedCountry] =
    useState<PhoneCountryOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const industriesState = usePoolOptions<IndustryOption>("/api/pool/industries");
  const recruiterRolesState = usePoolOptions<RecruiterRoleOption>(
    "/api/pool/recruiter-roles"
  );
  const companySizesState = usePoolOptions<CompanySizeOption>(
    "/api/pool/company-sizes"
  );
  const countriesState = usePoolOptions<PhoneCountryOption>(
    "/api/pool/countries"
  );

  useEffect(() => {
    setNextPath(new URL(window.location.href).searchParams.get("next"));

    async function loadEmail() {
      try {
        const res = await fetch("/api/auth/me");

        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        const data = await res.json();
        setEmail(data.email);
      } catch {
        window.location.href = recruiterAuthAccessUrl;
      } finally {
        setEmailLoading(false);
      }
    }

    loadEmail();
  }, []);

  const recruiterRoleOptions: SearchableSelectOption[] =
    recruiterRolesState.items.map((role) => ({
      id: role.id,
      label: role.name,
      searchText: role.name,
    }));

  const industryOptions: SearchableSelectOption[] = industriesState.items.map(
    (industryOption) => ({
      id: industryOption.id,
      label: industryOption.name,
      searchText: industryOption.name,
    })
  );

  const companySizeOptions: SearchableSelectOption[] =
    companySizesState.items.map((companySizeOption) => ({
      id: companySizeOption.id,
      label: companySizeOption.label,
      description:
        companySizeOption.max === null
          ? `${companySizeOption.min}+ employees`
          : `${companySizeOption.min}-${companySizeOption.max} employees`,
      searchText: `${companySizeOption.label} ${companySizeOption.min} ${
        companySizeOption.max ?? ""
      } employees`,
    }));

  useEffect(() => {
    if (selectedCountry || !countriesState.items.length) {
      return;
    }

    const india =
      countriesState.items.find((country) => country.isoCode === "IN") ??
      countriesState.items[0];

    if (india) {
      setSelectedCountry(india);
    }
  }, [countriesState.items, selectedCountry]);

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !firstName || !lastName || !companyName) {
      setError("Please fill all required fields.");
      return;
    }

    setError(null);
    setLoading(true);

    const selectedRecruiterRole =
      recruiterRolesState.items.find((role) => role.id === recruiterRoleId) ??
      null;
    const selectedIndustry =
      industriesState.items.find((industry) => industry.id === industryId) ??
      null;
    const selectedCompanySize =
      companySizesState.items.find((companySize) => companySize.id === companySizeId) ??
      null;

    const res = await fetch("/api/onboarding/recruiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        companyName,
        recruiterRole: selectedRecruiterRole?.id ?? null,
        recruiterRoleName: selectedRecruiterRole?.name ?? null,
        industryId: selectedIndustry?.id ?? null,
        industryName: selectedIndustry?.name ?? null,
        companySizeId: selectedCompanySize?.id ?? null,
        companySizeLabel: selectedCompanySize?.label ?? null,
        country: selectedCountry
          ? {
              name: selectedCountry.name,
              isoCode: selectedCountry.isoCode,
              phoneCode: selectedCountry.phoneCode,
            }
          : null,
        next: nextPath,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || "Failed to create workspace");
      setLoading(false);
      return;
    }

    window.location.href =
      data?.nextRoute ||
      buildRecruiterAppUrl({
        organizationId: data?.result?.organization_id,
        userId: data?.result?.user_id,
        nextPath,
      });
  }

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.12),_transparent_60%)]">
      <div className="mx-auto max-w-7xl px-10 pb-10 pt-5">
        <div className="grid items-start gap-14 lg:grid-cols-2">
          <section className="flex flex-col justify-start">
            <div className="mb-10">
              <RecruiterVisualPreview />
            </div>

            <h2 className="mb-4 text-3xl font-semibold text-white">
              Configure your hiring workspace
            </h2>

            <p className="mb-6 max-w-md text-white/70">
              We&apos;ll use this information to set up a secure, global-ready
              environment for conducting and evaluating interviews.
            </p>

            <ul className="space-y-2 text-sm text-white/65">
              <li>Your recruiter profile</li>
              <li>Your company hiring workspace</li>
              <li>Secure interview and evaluation access</li>
            </ul>

            <p className="mt-6 text-xs text-white/40">
              Secure onboarding · Global-ready · Enterprise-grade
            </p>
          </section>

          <section>
            <form
              onSubmit={handleCreateWorkspace}
              className="
                w-full max-w-lg
                min-h-[640px]
                rounded-2xl border border-cyan-400/20
                bg-gradient-to-b from-[#0F1F2A]/90 to-[#0A1016]/90
                p-8
                shadow-[0_0_60px_rgba(34,211,238,0.12)]
              "
            >
              <h3 className="mb-1 text-2xl font-semibold text-white">
                Set up your recruiter profile
              </h3>
              <p className="mb-6 text-sm text-white/60">
                This information helps us configure your hiring workspace.
              </p>

              <div className="mb-6">
                <p className="mb-3 text-xs uppercase tracking-wide text-white/50">
                  Personal information
                </p>

                <div className="mb-4 grid grid-cols-2 gap-4">
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

                <div className="mb-4">
                  <label className="text-xs text-white/60">Work email</label>
                  <input
                    className="input mt-1 cursor-not-allowed opacity-60"
                    value={emailLoading ? "Loading..." : email}
                    disabled
                  />
                </div>

                <PhoneInput
                  countries={countriesState.items}
                  selectedCountry={selectedCountry}
                  phone={phone}
                  loading={countriesState.loading}
                  error={countriesState.error}
                  onCountryChange={setSelectedCountry}
                  onPhoneChange={setPhone}
                />
              </div>

              <div className="mb-8">
                <p className="mb-3 text-xs uppercase tracking-wide text-white/50">
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
                  <SearchableSelect
                    options={recruiterRoleOptions}
                    valueId={recruiterRoleId}
                    placeholder="Recruiter role"
                    searchPlaceholder="Search recruiter roles"
                    loading={recruiterRolesState.loading}
                    error={recruiterRolesState.error}
                    onChange={(option) => setRecruiterRoleId(option.id)}
                  />

                  <SearchableSelect
                    options={industryOptions}
                    valueId={industryId}
                    placeholder="Industry"
                    searchPlaceholder="Search industries"
                    loading={industriesState.loading}
                    error={industriesState.error}
                    onChange={(option) => setIndustryId(option.id)}
                  />

                  <SearchableSelect
                    options={companySizeOptions}
                    valueId={companySizeId}
                    placeholder="Company size"
                    searchPlaceholder="Search company sizes"
                    loading={companySizesState.loading}
                    error={companySizesState.error}
                    onChange={(option) => setCompanySizeId(option.id)}
                  />
                </div>
              </div>

              {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

              <button
                type="submit"
                disabled={loading || emailLoading}
                className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
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
