import Link from "next/link";

type AuthCrossLinksProps = {
  prompt: string;
  actionLabel: string;
  actionHref: string;
  secondaryPrompt: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export default function AuthCrossLinks({
  prompt,
  actionLabel,
  actionHref,
  secondaryPrompt,
  secondaryLabel,
  secondaryHref,
}: AuthCrossLinksProps) {
  return (
    <>
      <p>
        {prompt}{" "}
        <Link
          href={actionHref}
          className="font-semibold text-brand-600 transition hover:text-brand-700"
        >
          {actionLabel}
        </Link>
      </p>

      <p className="mt-2 text-xs text-ink-muted">
        {secondaryPrompt}{" "}
        <Link
          href={secondaryHref}
          className="font-medium text-brand-600 transition hover:text-brand-700"
        >
          {secondaryLabel}
        </Link>
      </p>
    </>
  );
}
