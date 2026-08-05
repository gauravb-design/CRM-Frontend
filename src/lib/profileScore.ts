import type { UpworkProfile } from "../data/types";

export interface ProfileCheck {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
}

/** Upwork truncates the overview in search at roughly this many characters. */
const SEARCH_PREVIEW = 250;

const FILLER = /\b(passionate|hard.?working|detail.?oriented|team player|wide range|many clients|years of experience)\b/i;

/**
 * What actually decides whether a profile gets invited, checked one at a time.
 *
 * These are not style opinions — each one is a thing Upwork's search or a
 * hiring client reacts to. The score is the count that pass, so it moves only
 * when something real changes.
 */
export function checkProfile(p: UpworkProfile): ProfileCheck[] {
  const head = p.headline.trim();
  const overview = p.overview.trim();
  const firstLine = overview.split("\n")[0] ?? "";

  return [
    {
      id: "headline",
      label: "Headline says who it is for",
      ok: head.length >= 40 && head.length <= 90,
      hint: head.length < 40
        ? "Too short to say anything. Name the client and the outcome, 40 to 90 characters."
        : "Over 90 characters gets cut off in search results.",
    },
    {
      id: "hook",
      label: "Overview opens with a hook, not a greeting",
      ok: firstLine.length > 0 && firstLine.length <= 120 && !/^(hi|hello|welcome|my name)/i.test(firstLine),
      hint: "The first line is all most clients read. Lead with the problem you fix, not an introduction.",
    },
    {
      id: "length",
      label: "Overview is substantial",
      ok: overview.length >= SEARCH_PREVIEW,
      hint: `Under ${SEARCH_PREVIEW} characters looks unfinished next to other profiles.`,
    },
    {
      id: "filler",
      label: "No filler phrases",
      ok: !FILLER.test(overview) && !FILLER.test(head),
      hint: "“Passionate”, “detail oriented” and “wide range of clients” appear on every profile, so they say nothing.",
    },
    {
      id: "proof",
      label: "Overview contains a number",
      ok: /\d/.test(overview),
      hint: "One real result with a figure in it outperforms any amount of description.",
    },
    {
      id: "skills",
      label: "Between 5 and 15 skills",
      ok: p.skills.length >= 5 && p.skills.length <= 15,
      hint: p.skills.length < 5
        ? "Too few skills and you do not appear in enough searches."
        : "Too many reads as unfocused and dilutes the ones that matter.",
    },
    {
      id: "portfolio",
      label: "At least three portfolio pieces",
      ok: p.portfolio >= 3,
      hint: "Profiles with three or more pieces get materially more invitations.",
    },
    {
      id: "rate",
      label: "Rate is set",
      ok: p.rate > 0,
      hint: "A profile with no rate gets filtered out of most client searches.",
    },
  ];
}

export const scoreProfile = (p: UpworkProfile) => {
  const checks = checkProfile(p);
  return { checks, passed: checks.filter((c) => c.ok).length, total: checks.length };
};

/** The first thing worth fixing, which is what the chat leads with. */
export const weakestCheck = (p: UpworkProfile): ProfileCheck | null =>
  checkProfile(p).find((c) => !c.ok) ?? null;
