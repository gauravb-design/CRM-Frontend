import { cx } from "../lib/format";

export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
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

/** The small uppercase label used above every group of fields. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("text-[10.5px] text-faint uppercase tracking-[0.07em]", className)}>
      {children}
    </div>
  );
}
