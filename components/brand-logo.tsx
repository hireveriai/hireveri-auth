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
      {/* Dark-navy mark on white, so the chip is a white tile rather than the
          old navy one. The 126% scale crops the padding baked into the asset. */}
      <span className="hv-logo-chip relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
        <Image
          src="/verisnova_logo_on_white.png"
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
