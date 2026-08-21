"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = {
  id: string;
  label: string;
  description?: string;
  searchText?: string;
  icon?: string;
  trailing?: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  valueId?: string;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  onChange: (option: SearchableSelectOption) => void;
};

function SelectSkeleton() {
  return (
    <div className="input relative mt-0 animate-pulse overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="h-6 rounded-md bg-surface-2" />
    </div>
  );
}

export default function SearchableSelect({
  options,
  valueId,
  placeholder,
  searchPlaceholder = "Search",
  emptyMessage = "No options found.",
  loading = false,
  error = null,
  disabled = false,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === valueId) ?? null,
    [options, valueId]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [
        option.label,
        option.description,
        option.searchText,
        option.trailing,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (loading) {
    return <SelectSkeleton />;
  }

  const displayText = error
    ? "Failed to load options"
    : selectedOption?.label || placeholder;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (error) {
            return;
          }

          setOpen((current) => !current);
        }}
        className={`input flex items-center justify-between gap-3 text-left ${
          error ? "border-signal-risk text-signal-risk" : ""
        } ${disabled ? "opacity-60" : ""}`.trim()}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon ? (
            <span className="text-base">{selectedOption.icon}</span>
          ) : null}

          <span className="truncate text-sm">{displayText}</span>
        </span>

        <span className="flex items-center gap-2 text-xs text-ink-muted">
          {selectedOption?.trailing ? (
            <span className="truncate">{selectedOption.trailing}</span>
          ) : null}
          <span className="text-ink-muted">{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {error ? (
        <p className="mt-2 text-xs text-signal-risk">{error}</p>
      ) : null}

      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lg backdrop-blur-md">
          <div className="border-b border-line p-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="input !bg-surface-2 !py-2 text-sm"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-surface-2 ${
                    option.id === valueId ? "bg-brand-50" : ""
                  }`.trim()}
                >
                  <span className="flex min-w-0 items-start gap-2">
                    {option.icon ? (
                      <span className="pt-0.5 text-base">{option.icon}</span>
                    ) : null}

                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink-strong">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="block truncate text-xs text-ink-muted">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </span>

                  {option.trailing ? (
                    <span className="shrink-0 text-xs text-brand-600">
                      {option.trailing}
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-ink-muted">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
