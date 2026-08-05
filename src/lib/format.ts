import { DAY, NOW } from "../data/contacts";
import type { Contact } from "../data/types";

export const fullName = (c: Contact) => `${c.firstName} ${c.lastName}`;
export const initials = (c: Contact) => (c.firstName[0] + c.lastName[0]).toUpperCase();

/** Two-letter mark from any label, for avatars with no person behind them. */
export function letterMark(text: string): string {
  const words = text.replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "—";
}

export const money = (n: number) => `$${Math.round(n / 1000)}k`;

export const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Short relative age, the way a mail client labels a row. */
export function rel(ts: number | null): string {
  if (!ts) return "—";
  const mins = Math.round((NOW - ts) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  const d = Math.round(mins / 1440);
  return d === 1 ? "Yesterday" : `${d}d`;
}

export const daysSince = (ts: number | null) =>
  ts ? Math.max(0, Math.round((NOW - ts) / DAY)) : 0;

export const shortDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function fullDate(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " at " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export const firstLine = (body: string) => body.split("\n")[0];

/** Join class names, dropping anything falsy. */
export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");
