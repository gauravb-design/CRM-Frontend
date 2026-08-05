import { cx } from "../lib/format";
import { placeholderImage } from "../lib/placeholder";

interface PillProps {
  /**
   * A background/text Tailwind pair, e.g. `"bg-greensoft text-green"` — not a
   * colour name. Take it from a map in lib/tokens.ts so the same state reads
   * the same everywhere; a bare `"green"` compiles and renders unstyled.
   */
  tone: string;
  children: React.ReactNode;
}

export function Pill({ tone, children }: PillProps) {
  return (
    <span className={cx("text-[11px] px-[9px] py-[2px] rounded-[5px] whitespace-nowrap", tone)}>
      {children}
    </span>
  );
}

interface AvatarProps {
  children: React.ReactNode;
  size?: number;
  /** Outbound messages use the muted treatment so inbound stands out. */
  muted?: boolean;
}

export function Avatar({ children, size = 32, muted }: AvatarProps) {
  return (
    <span
      className={cx(
        "rounded-full inline-flex items-center justify-center shrink-0 font-semibold",
        muted ? "bg-stone text-muted" : "bg-greensoft text-green",
      )}
      style={{ width: size, height: size, fontSize: Math.max(9.5, size * 0.34) }}
    >
      {children}
    </span>
  );
}

interface ThumbProps {
  /** Also what the artwork is generated from, so it stays stable per row. */
  seed: string;
  alt: string;
  size?: number;
  className?: string;
}

/** Square artwork for things that are not people — profiles, jobs, listings. */
export function Thumb({ seed, alt, size = 48, className }: ThumbProps) {
  return (
    <img
      src={placeholderImage(seed, size)}
      width={size}
      height={size}
      alt={alt}
      className={cx("rounded-[8px] shrink-0 object-cover", className)}
    />
  );
}

/** The small uppercase label used above every group of fields. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("text-[10.5px] text-faint uppercase tracking-[0.07em]", className)}>
      {children}
    </div>
  );
}
