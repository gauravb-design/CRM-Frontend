import type { ReactNode } from "react";
import { cx } from "../lib/format";
import { useCrm } from "../state/store";

export function Toast() {
  const { state } = useCrm();
  if (!state.toast) return null;
  return (
    <div
      role="status"
      className="fixed left-1/2 bottom-[26px] -translate-x-1/2 bg-ink text-canvas text-[12.5px] px-[18px] py-[10px] rounded-lg z-80 fadein"
    >
      {state.toast}
    </div>
  );
}

export function Empty({ children, dashed }: { children: ReactNode; dashed?: boolean }) {
  return (
    <div
      className={cx(
        "text-center text-[12.5px] text-faint leading-relaxed",
        dashed ? "border border-dashed border-[#dfdcd5] rounded-[10px] px-5 py-[34px]" : "px-5 py-[34px]",
      )}
    >
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("bg-surface border border-line rounded-[10px]", className)}>{children}</div>
  );
}

/** A caution strip. Amber because these are all "you should know", not errors. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="bg-ambersoft border border-amberline rounded-[9px] px-[14px] py-[10px] text-xs text-amber leading-relaxed">
      {children}
    </div>
  );
}
