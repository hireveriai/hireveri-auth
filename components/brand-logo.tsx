import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  className?: string;
  href?: string;
  imageClassName?: string;
  priority?: boolean;
};

export default function BrandLogo({
  className = "",
  href = "/",
  imageClassName = "h-12 w-auto",
  priority = false,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="HireVeri"
      className={`inline-flex items-center ${className}`.trim()}
    >
      <Image
        src="/hireveri_logo.png"
        alt="HireVeri"
        width={1536}
        height={1024}
        priority={priority}
        className={imageClassName}
      />
    </Link>
  );
}
