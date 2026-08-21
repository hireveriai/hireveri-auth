import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  className?: string;
  href?: string;
  /** Hide the wordmark and show the chip alone (tight layouts). */
  markOnly?: boolean;
  priority?: boolean;
};

export default function BrandLogo({
  className = "",
  href = "/",
  markOnly = false,
  priority = false,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="HireVeri"
      className={`inline-flex items-center gap-2.5 ${className}`.trim()}
    >
      {/* The glyph is white, so it needs the navy chip to read on a light page.
          The 126% scale crops the transparent padding baked into the asset. */}
      <span className="hv-logo-chip relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
        <Image
          src="/hireveri_logo_white.png"
          alt=""
          width={180}
          height={180}
          priority={priority}
          className="h-[126%] w-[126%] max-w-none shrink-0 object-contain"
        />
      </span>

      {markOnly ? null : (
        <span className="flex flex-col justify-center">
          <span className="text-[0.95rem] font-semibold leading-tight tracking-[0.03em] text-ink-strong">
            HireVeri
          </span>
          <span className="mt-0.5 text-[0.65rem] font-medium leading-tight text-ink-muted">
            Structured Interview Intelligence
          </span>
        </span>
      )}
    </Link>
  );
}
