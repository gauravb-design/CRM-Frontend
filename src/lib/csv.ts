/**
 * Minimal RFC 4180 parser. Apollo exports quote any field containing a comma,
 * and job titles are full of them ("Head of Marketing, EMEA"), so a naive
 * split on "," corrupts roughly every third row.
 */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Apollo has renamed these columns more than once and lets you reorder them on
 * export, so we match on name rather than position and accept the variants
 * we have actually seen.
 */
const ALIASES: Record<string, string[]> = {
  firstName: ["first name", "first_name", "firstname"],
  lastName: ["last name", "last_name", "lastname"],
  title: ["title", "job title", "person title"],
  company: ["company", "company name for emails", "organization name", "account name", "employer"],
  email: ["email", "work email", "primary email", "email address"],
  linkedin: ["person linkedin url", "linkedin url", "linkedin", "person linkedin"],
  city: ["city", "location"],
  country: ["country"],
};

export type ColumnMap = Partial<Record<keyof typeof ALIASES, number>>;

export function resolveColumns(headers: string[]): ColumnMap {
  const norm = headers.map((h) => h.trim().toLowerCase());
  const map: ColumnMap = {};
  for (const [field, names] of Object.entries(ALIASES)) {
    const idx = norm.findIndex((h) => names.includes(h));
    if (idx !== -1) map[field as keyof typeof ALIASES] = idx;
  }
  return map;
}

/** A work address is also evidence the company is real. */
export const PERSONAL_DOMAINS = [
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk", "yahoo.com",
  "yahoo.co.uk", "outlook.com", "live.com", "aol.com", "icloud.com", "me.com",
  "proton.me", "protonmail.com", "gmx.com", "mail.com",
];

export const isPersonalEmail = (email: string) =>
  PERSONAL_DOMAINS.includes(email.split("@")[1]?.trim().toLowerCase() ?? "");
