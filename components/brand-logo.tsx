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
      aria-label="VerisNova"
      className={`inline-flex items-center gap-2.5 ${className}`.trim()}
    >
      {/* Light-surface logo: the white + teal enterprise mark on its navy
          tile (the white half would vanish on a light page without it). */}
      <span className="hv-logo-chip relative flex h-10 w-10 shrink-0 items-center justify-center">
        <Image
          src="/verisnova-logo-light.png"
          alt=""
          width={512}
          height={512}
          priority={priority}
          className="h-full w-full object-contain"
        />
      </span>

      {markOnly ? null : (
        <span className="flex flex-col justify-center">
          <span className="text-[0.95rem] font-semibold leading-tight tracking-[0.03em] text-ink-strong">
            VerisNova
          </span>
          <span className="mt-0.5 text-[0.65rem] font-medium leading-tight text-ink-muted">
            Structured Interview Intelligence
          </span>
        </span>
      )}
    </Link>
  );
}
