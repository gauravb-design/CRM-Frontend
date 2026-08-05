/**
 * Contacts arrive from Apollo with the profile written as `linkedin.com/in/x`
 * — no scheme — and hand-added ones can be blank or a dash. Anything that
 * opens a tab has to go through here, or a rep clicks a link and lands on a
 * relative path inside our own app.
 */
export function profileUrl(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v || v === "—") return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, "")}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

/** True for a URL that is at least plausibly a LinkedIn profile. */
export function looksLikeLinkedIn(raw: string): boolean {
  const url = profileUrl(raw);
  if (!url) return false;
  try {
    return new URL(url).hostname.toLowerCase().endsWith("linkedin.com");
  } catch {
    return false;
  }
}
