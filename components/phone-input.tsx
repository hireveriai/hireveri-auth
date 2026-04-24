"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type PhoneCountryOption = {
  name: string;
  isoCode: string;
  phoneCode: string;
  flag?: string | null;
};

type PhoneInputProps = {
  countries: PhoneCountryOption[];
  selectedCountry: PhoneCountryOption | null;
  phone: string;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  onCountryChange: (country: PhoneCountryOption) => void;
  onPhoneChange: (value: string) => void;
};

function PhoneInputSkeleton() {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3">
      <div className="input animate-pulse">
        <div className="h-6 rounded-md bg-white/6" />
      </div>
      <div className="input animate-pulse">
        <div className="h-6 rounded-md bg-white/6" />
      </div>
    </div>
  );
}

export default function PhoneInput({
  countries,
  selectedCountry,
  phone,
  loading = false,
  error = null,
  disabled = false,
  onCountryChange,
  onPhoneChange,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return countries;
    }

    return countries.filter((country) => {
      const haystack = `${country.name} ${country.isoCode} ${country.phoneCode}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [countries, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  if (loading) {
    return <PhoneInputSkeleton />;
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="grid grid-cols-[160px_1fr] gap-3">
        <button
          type="button"
          disabled={disabled || !!error}
          onClick={() => setOpen((current) => !current)}
          className={`input flex items-center justify-between gap-3 ${
            disabled ? "opacity-60" : ""
          } ${error ? "border-red-400/30 text-red-200" : ""}`.trim()}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-base">{selectedCountry?.flag || "🌐"}</span>
            <span className="truncate text-sm text-white">
              {selectedCountry?.phoneCode || "+91"}
            </span>
          </span>
          <span className="text-xs text-white/35">{open ? "▲" : "▼"}</span>
        </button>

        <input
          type="tel"
          className="input"
          placeholder="Phone number"
          value={phone}
          onChange={(event) =>
            onPhoneChange(event.target.value.replace(/[^\d\s()-]/g, ""))
          }
          disabled={disabled}
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-300/85">{error}</p> : null}

      {open ? (
        <div className="absolute left-0 z-30 mt-2 w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-white/10 bg-[#0d141c]/95 shadow-[0_24px_60px_rgba(2,8,15,0.55)] backdrop-blur-md">
          <div className="border-b border-white/8 p-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search countries"
              className="input !bg-black/30 !py-2 text-sm"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredCountries.length ? (
              filteredCountries.map((country) => (
                <button
                  key={country.isoCode}
                  type="button"
                  onClick={() => {
                    onCountryChange(country);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/7 ${
                    country.isoCode === selectedCountry?.isoCode ? "bg-white/8" : ""
                  }`.trim()}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="text-base">{country.flag || "🌐"}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">
                        {country.name}
                      </span>
                      <span className="block truncate text-xs text-white/45">
                        {country.isoCode}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-cyan-100/80">
                    {country.phoneCode}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-white/45">
                No countries found.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
