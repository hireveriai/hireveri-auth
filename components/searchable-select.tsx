"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const instanceId = useRef(
    `select-${placeholder.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  ).current;

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
    setHighlightedIndex(0);
  }, [query, open]);

  useEffect(() => {
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  function selectOption(option: SearchableSelectOption) {
    onChange(option);
    setOpen(false);
    setQuery("");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        filteredOptions.length
          ? (current + 1) % filteredOptions.length
          : current
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        filteredOptions.length
          ? (current - 1 + filteredOptions.length) % filteredOptions.length
          : current
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];

      if (option) {
        selectOption(option);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    } else if (event.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updateMenuRect() {
      const rect = rootRef.current?.getBoundingClientRect();

      if (rect) {
        setMenuRect({ top: rect.bottom, left: rect.left, width: rect.width });
      }
    }

    updateMenuRect();

    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);

    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
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
        onKeyDown={(event) => {
          if (error) {
            return;
          }

          if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            setOpen(true);
          }
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

      {open && menuRect
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: menuRect.top + 8,
                left: menuRect.left,
                width: menuRect.width,
              }}
              className="z-30 overflow-hidden rounded-xl border border-line bg-surface shadow-lg backdrop-blur-md"
            >
              <div className="border-b border-line p-3">
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="input !bg-surface-2 !py-2 text-sm"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={`${instanceId}-listbox`}
                  aria-activedescendant={
                    filteredOptions[highlightedIndex]
                      ? `${instanceId}-option-${filteredOptions[highlightedIndex].id}`
                      : undefined
                  }
                />
              </div>

              <div
                id={`${instanceId}-listbox`}
                role="listbox"
                className="max-h-64 overflow-y-auto p-2"
              >
                {filteredOptions.length ? (
                  filteredOptions.map((option, index) => (
                    <button
                      key={option.id}
                      id={`${instanceId}-option-${option.id}`}
                      ref={(el) => {
                        optionRefs.current[index] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={option.id === valueId}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => selectOption(option)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-surface-2 ${
                        option.id === valueId ? "bg-brand-50" : ""
                      } ${index === highlightedIndex ? "bg-surface-2" : ""}`.trim()}
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
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
