import { NOW } from "../data/contacts";
import type { Contact } from "../data/types";
import { isPersonalEmail, parseCsv, resolveColumns } from "./csv";

export type NewContact = Omit<Contact, "id">;

export interface SkipGroup {
  reason: string;
  count: number;
}

export interface ImportAnalysis {
  fileName: string;
  headers: string[];
  /** Data rows in the file, not counting the header. */
  total: number;
  ready: NewContact[];
  skipped: SkipGroup[];
  /** Required columns we could not find, by their Apollo name. */
  missing: string[];
}

const REQUIRED: Array<[key: "firstName" | "email" | "company", label: string]> = [
  ["firstName", "First Name"],
  ["email", "Email"],
  ["company", "Company"],
];

/**
 * Read an Apollo export and decide, row by row, what is worth keeping.
 *
 * Every rejection is counted and named rather than dropped quietly. A silent
 * import that says "268 added" while binning 70 rows is how a rep ends up
 * wondering why half a list never got contacted.
 */
export function analyseApolloCsv(
  fileName: string,
  text: string,
  existing: Contact[],
  owner: string,
): ImportAnalysis {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { fileName, headers: [], total: 0, ready: [], skipped: [], missing: REQUIRED.map((r) => r[1]) };
  }

  const headers = rows[0].map((h) => h.trim());
  const cols = resolveColumns(headers);
  const missing = REQUIRED.filter(([k]) => cols[k] === undefined).map(([, label]) => label);
  if (missing.length) {
    return { fileName, headers, total: rows.length - 1, ready: [], skipped: [], missing };
  }

  const at = (row: string[], key: keyof typeof cols) => {
    const i = cols[key];
    return i === undefined ? "" : (row[i] ?? "").trim();
  };

  const known = new Set(existing.map((c) => c.email.toLowerCase()));
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  const bump = (reason: string) => counts.set(reason, (counts.get(reason) ?? 0) + 1);

  const ready: NewContact[] = [];

  for (const row of rows.slice(1)) {
    const email = at(row, "email").toLowerCase();
    const first = at(row, "firstName");
    const company = at(row, "company");

    if (!first || !company) {
      bump("Missing a name or a company");
      continue;
    }
    if (!email) {
      bump("No email address");
      continue;
    }
    if (isPersonalEmail(email)) {
      bump("Personal email domain");
      continue;
    }
    if (known.has(email)) {
      bump("Already in the CRM");
      continue;
    }
    if (seen.has(email)) {
      bump("Duplicated inside this file");
      continue;
    }
    seen.add(email);

    const city = at(row, "city");
    const country = at(row, "country");
    ready.push({
      firstName: first,
      lastName: at(row, "lastName") || "—",
      title: at(row, "title") || "Unknown",
      company,
      location: [city, country].filter(Boolean).join(", ") || "—",
      email,
      linkedin: at(row, "linkedin") || "—",
      // Apollo has no column for this. It has to be written by a person before
      // the opener means anything, so it starts empty rather than invented.
      hook: "",
      status: "New",
      owner,
      source: "Apollo CSV",
      seqId: 0,
      seqStep: 0,
      createdAt: NOW,
      lastAt: NOW,
      li: "none",
      liAt: null,
      recycleAt: null,
    });
  }

  const skipped = [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return { fileName, headers, total: rows.length - 1, ready, skipped, missing: [] };
}
