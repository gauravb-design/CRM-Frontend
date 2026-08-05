import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cx } from "../lib/format";

type Variant = "primary" | "default" | "quiet";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
}

const BASE = "rounded-[7px] cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT: Record<Variant, string> = {
  primary: "bg-green text-white border border-green hover:bg-[#164031]",
  default: "bg-surface text-ink2 border border-line hover:border-[#c9c5bc]",
  quiet: "bg-transparent text-muted border border-transparent hover:text-ink",
};

const size = (small?: boolean) =>
  small ? "px-[11px] py-[5px] text-[11.5px]" : "px-[13px] py-[7px] text-xs";

export function Button({ variant = "default", small, className, ...rest }: Props) {
  return (
    <button type="button" className={cx(BASE, VARIANT[variant], size(small), className)} {...rest} />
  );
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  small?: boolean;
}

/**
 * A real anchor that looks like a button, for anything leaving the app.
 * `window.open` from a click handler loses middle-click and ctrl-click, which
 * is exactly how a rep opens ten profiles at once.
 */
export function LinkButton({ variant = "default", small, className, ...rest }: LinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cx(BASE, VARIANT[variant], size(small), "inline-block no-underline", className)}
      {...rest}
    />
  );
}
