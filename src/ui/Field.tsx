import type { ReactNode } from "react";
import { cx } from "../lib/format";

export const inputCls =
  "w-full bg-surface border border-line rounded-[7px] px-[10px] py-2 text-[12.5px]";

export function Field({ label, hint, span, children }: {
  label: string;
  hint?: string;
  span?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cx(span && "col-span-2")}>
      <label className="block text-[10.5px] text-muted uppercase tracking-[0.06em] mb-[5px]">
        {label}
      </label>
      {children}
      {hint && <div className="text-[11px] text-faint mt-[5px] leading-snug">{hint}</div>}
    </div>
  );
}

/** The panel every form page sits in, so they all share one width and rhythm. */
export function FormPanel({ children, width = 620 }: { children: ReactNode; width?: number }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-[22px] py-[18px]">
      <div style={{ maxWidth: width }}>{children}</div>
    </div>
  );
}
