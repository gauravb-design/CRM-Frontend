import type { Contact, ProfileMessage, UpworkProfile } from "../data/types";
import { scoreProfile, weakestCheck } from "./profileScore";

/**
 * Canned today, personalised from the profile that is actually open. Swapping
 * these two functions for a model call is the whole integration — everything
 * around them already treats the answer as text plus an optional field edit.
 */

const headlineFor = (p: UpworkProfile) =>
  p.skills[0]
    ? `${p.skills[0]} specialist helping ${p.name.toLowerCase()} teams ship screens users finish`
    : "Product designer helping teams ship screens users finish";

const overviewFor = (p: UpworkProfile) =>
  `I fix the screens where your users give up.\n\n` +
  `Most ${p.name.toLowerCase()} projects fail in the same places: too much asked before any value is shown, ` +
  `empty states that explain nothing, and the main action buried below the fold.\n\n` +
  `Recent result: cut an onboarding flow from 9 steps to 4 and activation rose 31%.\n\n` +
  `I work in Figma, hand off a component library your engineers can build from, and stay available ` +
  `through the build rather than disappearing at handoff.`;

/** Answer a question about the profile, with an edit attached when there is one. */
export function profileReply(p: UpworkProfile, question: string): Omit<ProfileMessage, "id" | "role"> {
  const q = question.toLowerCase();

  if (/headline|title|heading/.test(q)) {
    return {
      body: "Your headline has to name who you help and what changes. Here is one built from your top skill — it is 78 characters, which survives truncation in search.",
      apply: { field: "headline", value: headlineFor(p) },
    };
  }

  if (/overview|summary|bio|about|description/.test(q)) {
    return {
      body: "The first line is the only part most clients read, so it should be the problem you fix rather than an introduction. This version opens on the problem and puts a real number in the third paragraph.",
      apply: { field: "overview", value: overviewFor(p) },
    };
  }

  if (/skill/.test(q)) {
    const wanted = ["UI/UX Design", "Figma", "Design Systems", "User Research", "Prototyping", "Web Design", "SaaS"];
    return {
      body: `You have ${p.skills.length}. Between five and fifteen is the band that gets you into enough searches without reading as unfocused — these seven cover the work you actually want.`,
      apply: { field: "skills", value: wanted.join(", ") },
    };
  }

  if (/rate|price|charge|hourly/.test(q)) {
    return {
      body: `You are at $${p.rate}/hr. Raising it only works once the profile earns it — a five-star record, three or more portfolio pieces, and a headline that names an outcome. Fix those first, then move in $10 steps and watch the invite rate rather than guessing.`,
    };
  }

  if (/portfolio|work|sample|case/.test(q)) {
    return {
      body: `You have ${p.portfolio} pieces. Three is the point where invitations climb noticeably. Each one wants a before, an after, and a number — a gallery of pretty screens with no outcome persuades nobody.`,
    };
  }

  const weak = weakestCheck(p);
  const { passed, total } = scoreProfile(p);
  if (!weak) {
    return { body: `All ${total} checks pass. Ask me to rewrite the headline or the overview if you want to try a different angle.` };
  }
  return {
    body: `${passed} of ${total} checks pass. The one costing you most is **${weak.label.toLowerCase()}** — ${weak.hint}\n\nAsk me to rewrite the headline, the overview, or the skills and I will draft it.`,
  };
}

/** First-draft proposal, written from the job post and the profile it is sent from. */
export function proposalDraft(jobTitle: string, profile: UpworkProfile, client: Contact): string {
  const subject = jobTitle.trim() || "the role";
  return (
    `Your post for ${subject} reads like the problem is not the design itself but what it is being asked to do.\n\n` +
    `I would start by narrowing it to the one or two things ${client.company} needs that screen to achieve, ` +
    `then cut everything that is not serving them. That order matters — redesigning before that decision is made ` +
    `just produces a prettier version of the same problem.\n\n` +
    `Closest thing I have to your brief: ${profile.overview.split("\n").find((l) => /\d/.test(l))?.trim() ?? "a rebuild that lifted activation by a third"}\n\n` +
    `Happy to walk through it on a short call before you commit to anything.`
  );
}

/**
 * Replies inside an Upwork conversation. Same shape as the LinkedIn drafter:
 * three angles, rotated, so asking again gives something genuinely different.
 */
export function upworkReply(c: Contact, angle: number, lastInbound: string): string {
  const f = c.firstName;
  const heard = lastInbound.trim().length > 0;

  if (angle === 1) {
    return `Easier to show than describe, ${f} — fifteen minutes and I can walk you through the closest project I have to this.\n\nWould Tuesday or Wednesday suit?`;
  }
  if (angle === 2) {
    return `Understood, ${f}. If the budget or the timing is not there yet, say so and I will leave it — no hard feelings.\n\nIf it is scope you are unsure about, I can put a fixed-price first phase together instead.`;
  }
  return heard
    ? `Good question, ${f}. Short answer: the first week is structure rather than screens — what the thing is for, which view does the work, and what gets cut. Design starts once that is settled, which is what stops the rebuild happening twice.\n\nWhat does success look like for you three months after launch?`
    : `Thanks ${f}. What would be most useful to go through first?`;
}
