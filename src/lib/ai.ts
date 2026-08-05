import type { Contact, Thread } from "../data/types";

export type AiIntent =
  | "opener"
  | "angle"
  | "answer"
  | "objection"
  | "qualify"
  | "shorter"
  | "direct";

export interface IntentOption {
  id: AiIntent;
  label: string;
  note: string;
}

/**
 * Two kinds of assist, and the difference matters when this meets a real model.
 *
 * Composing from scratch is canned copy here, personalised from the contact's
 * hook — swapping it for an API call means replacing `compose` and nothing
 * else. Shortening and de-hedging are genuine transformations of whatever is
 * in the box, so they already behave exactly as the shipped version will.
 */
export function compose(c: Contact, intent: AiIntent): string {
  const f = c.firstName;
  switch (intent) {
    case "opener":
      return `Hi ${f},\n\nNoticed your ${c.hook}.\n\nWe fixed the same thing for a company about your size and their cost per enquiry came down by roughly a third.\n\nWorth a look at ${c.company}?`;
    case "angle":
      return `Hi ${f},\n\nDifferent thought to my last one. Most of ${c.company}’s traffic is on a phone, and the site is laid out desktop first.\n\nThat gap is usually worth more than any change to ad spend.\n\nWorth fifteen minutes?`;
    case "answer":
      return `Hi ${f},\n\nGood question. It depends how much of the site we touch, so I would rather give you a real number than a range — fifteen minutes and I can.\n\nDoes Tuesday 11am or Wednesday 2pm work?`;
    case "objection":
      return `Hi ${f},\n\nUnderstood, and thanks for being straight with me. I will come back in October rather than chase you before then.\n\nIf anything moves sooner, just reply here.`;
    case "qualify":
      return `Hi ${f},\n\nBefore I send anything over — is the goal more enquiries, or better ones? The answer changes what would be worth showing you.`;
    default:
      return "";
  }
}

/** Keep the greeting, the first statement, and the closing question. */
export function shorten(text: string): string {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  const greet = /^(hi|hello|hey)\b/i.test(lines[0]) ? lines[0] : "";
  const body = (greet ? lines.slice(1) : lines).join(" ");
  const parts = body.match(/[^.?!]+[.?!]+/g) ?? [body];
  const question = parts.filter((x) => x.trim().endsWith("?")).pop();
  const first = parts.find((x) => !x.trim().endsWith("?"));

  const out: string[] = [];
  if (greet) out.push(greet, "");
  if (first) out.push(first.trim(), "");
  out.push((question ?? "Worth a look?").trim());
  return out.join("\n");
}

const HEDGES = [
  /\bjust\b/gi,
  /\bI think\b/gi,
  /\bmaybe\b/gi,
  /\bperhaps\b/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
  /\bI was wondering\b/gi,
  /\bprobably\b/gi,
  /\bif that is useful\b/gi,
  /\bhappy to\b/gi,
  /\ba quick\b/gi,
  /\breally\b/gi,
];

/** Strip the hedges that make a cold email sound unsure of itself. */
export function direct(text: string): string {
  let out = text;
  for (const h of HEDGES) out = out.replace(h, "");
  return out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.?!])/g, "$1")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/(^|[.?!]\s+|\n)([a-z])/g, (_m, pre: string, ch: string) => pre + ch.toUpperCase())
    .trim();
}

const QUEUED_INTENTS: IntentOption[] = [
  { id: "opener", label: "Write the opener", note: "Built on what we noticed about their site" },
  { id: "angle", label: "Try a different angle", note: "Same person, a different problem" },
  { id: "shorter", label: "Make it shorter", note: "Down to one statement and the question" },
  { id: "direct", label: "Make it more direct", note: "Strips the hedging out of what is there" },
];

const REPLY_INTENTS: IntentOption[] = [
  { id: "answer", label: "Answer and offer times", note: "Replies to what they asked, proposes two slots" },
  { id: "objection", label: "Handle the objection", note: "Takes the no, keeps the door open" },
  { id: "qualify", label: "Ask a qualifying question", note: "Before sending anything over" },
  { id: "shorter", label: "Make it shorter", note: "Down to one statement and the question" },
];

export const intentsFor = (t: Thread): IntentOption[] =>
  t.state === "queued" ? QUEUED_INTENTS : REPLY_INTENTS;

/**
 * Apply an intent. Returns null when there is nothing to work from, so the
 * caller can say so rather than invent a message out of an empty box.
 */
export function generate(c: Contact, intent: AiIntent, current: string): string | null {
  const text =
    intent === "shorter"
      ? shorten(current)
      : intent === "direct"
        ? direct(current)
        : compose(c, intent);
  return text.trim() ? text : null;
}

/* --------------------------------------------------------------- LinkedIn
 * LinkedIn has no API, so the loop is: paste in what they said, draft a
 * reply here, copy it back. Replies run shorter than email — three sentences
 * is already long in a LinkedIn chat.
 */

export type LiIntent = "liAnswer" | "liCall" | "liObjection" | "shorter" | "direct";

export const LI_INTENTS: Array<{ id: LiIntent; label: string; note: string }> = [
  { id: "liAnswer", label: "Answer what they asked", note: "Straight answer, then one question back" },
  { id: "liCall", label: "Move it to a call", note: "Offers two slots without a pitch" },
  { id: "liObjection", label: "Handle the objection", note: "Takes the no, keeps the door open" },
  { id: "shorter", label: "Make it shorter", note: "Two sentences, LinkedIn length" },
];

function composeLi(c: Contact, intent: LiIntent, lastInbound: string): string {
  const f = c.firstName;
  const asked = lastInbound.trim().length > 0;
  switch (intent) {
    case "liAnswer":
      return asked
        ? `Good question, ${f}. Short version: we would start with the ${c.hook || "site"}, because that is where the drop-off is, and everything after it gets cheaper once it is fixed.\n\nWhat does the site do for you at the moment — enquiries, or bookings?`
        : `Thanks ${f}. Happy to go into detail — what would be most useful to know first?`;
    case "liCall":
      return `Easier on a call than here, ${f} — fifteen minutes and I can show you rather than describe it.\n\nTuesday 11am or Wednesday 2pm?`;
    case "liObjection":
      return `Understood, ${f}, and thanks for saying so rather than leaving it.\n\nI will come back in a few months. If anything changes before then, this thread is the quickest way to reach me.`;
    default:
      return "";
  }
}

/**
 * Draft a LinkedIn reply. `shorter` and `direct` transform what is already in
 * the box and return null when it is empty, rather than inventing a message.
 */
export function generateLi(
  c: Contact,
  intent: LiIntent,
  current: string,
  lastInbound: string,
): string | null {
  const text =
    intent === "shorter"
      ? shorten(current)
      : intent === "direct"
        ? direct(current)
        : composeLi(c, intent, lastInbound);
  return text.trim() ? text : null;
}

/** The LinkedIn opener suggested once someone accepts. Copied out, not sent. */
export const liVariants = (c: Contact): string[] => [
  `Thanks for connecting, ${c.firstName}. I had a look at ${c.company} — your ${c.hook}, which is usually a quick fix.\n\nWant me to send over what I would change?`,
  `${c.firstName}, thanks for the add. One thing stood out on ${c.company}: your ${c.hook}.\n\nI can send a short note on it if that is useful. No pitch.`,
];
