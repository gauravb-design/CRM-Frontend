import type { AdObjective, AdPlatform, CampaignType } from "../data/types";
import { usd } from "./paidMetrics";
import { draftAssets, judgeBudget, recommendType } from "./paidWizard";

export type SlotId =
  | "objective" | "platform" | "tracking" | "feed"
  | "targetCpa" | "dailyBudget" | "budgetCheck"
  | "geo" | "audience" | "service" | "name";

export interface Draft {
  objective?: AdObjective;
  platform?: AdPlatform;
  hasTracking?: boolean;
  hasFeed?: boolean;
  type?: CampaignType;
  targetCpa?: number;
  dailyBudget?: number;
  /** Set once the budget has been argued about, so it is not raised twice. */
  budgetSettled?: boolean;
  geo?: string;
  audience?: string;
  service?: string;
  name?: string;
  landingUrl?: string;
  headlines?: string[];
  descriptions?: string[];
}

export interface Prompt {
  slot: SlotId | null;
  ask: string;
  options?: string[];
  placeholder?: string;
}

const money = (raw: string) => {
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

const yes = (raw: string) => /^(y|yes|yeah|yep|true|we do|it is|live)/i.test(raw.trim());

/**
 * What to ask next, and why.
 *
 * Order is not cosmetic. The goal comes before the platform because the goal
 * decides which platform is even sensible; tracking comes before budget
 * because it decides the campaign type, which changes what the budget has to
 * clear. Asking in the order a form would lay it out gets the wrong answers.
 */
export function nextPrompt(d: Draft): Prompt {
  if (!d.objective) {
    return {
      slot: "objective",
      ask: "What do you want this campaign to bring in? That decides everything else, so it is worth being blunt about it.",
      options: ["Leads", "Sales", "Traffic", "Awareness"],
    };
  }
  if (!d.platform) {
    return {
      slot: "platform",
      ask: `${d.objective} can work on either. Google reaches people already searching for it; Meta puts it in front of people who were not looking. Which are we doing?`,
      options: ["Google", "Meta"],
    };
  }
  if (d.hasTracking === undefined) {
    return {
      slot: "tracking",
      ask: "Is conversion tracking live on the site? I ask first because automated bidding has nothing to aim at without it, and that rules out half the campaign types.",
      options: ["Yes, it's live", "No, not yet"],
    };
  }
  if (d.hasFeed === undefined) {
    return {
      slot: "feed",
      ask: "Is there a product feed or catalogue connected?",
      options: ["Yes", "No"],
    };
  }
  if (!d.targetCpa) {
    return {
      slot: "targetCpa",
      ask: `What is a ${d.objective === "Sales" ? "sale" : "lead"} actually worth to you? Give me the most you would happily pay for one.`,
      placeholder: "90",
    };
  }
  if (!d.dailyBudget) {
    return { slot: "dailyBudget", ask: "And what can you spend a day?", placeholder: "120" };
  }
  if (!d.budgetSettled) {
    const v = judgeBudget(d.platform, d.dailyBudget, d.targetCpa);
    if (!v.ok) {
      return {
        slot: "budgetCheck",
        ask: `${v.note} Which way do you want to go?`,
        options: [`Raise to ${usd(v.floor)} a day`, `Keep ${usd(d.dailyBudget)} a day`],
      };
    }
  }
  if (!d.geo) {
    return { slot: "geo", ask: "Where should it run?", placeholder: "United Arab Emirates" };
  }
  if (!d.audience) {
    return {
      slot: "audience",
      ask: "Who are we trying to reach? Job titles, company size, anything that narrows it.",
      placeholder: "Business owners, 10–200 staff",
    };
  }
  if (!d.service) {
    return {
      slot: "service",
      ask: "Last thing before the copy — what are you selling them?",
      placeholder: "web design",
    };
  }
  if (!d.name) {
    return {
      slot: "name",
      ask: "Give it a name for your own reference and I will put it together.",
      placeholder: `${d.type} — ${d.geo}`,
    };
  }
  return { slot: null, ask: "That is everything. Review it on the right, then save it as a draft or start it." };
}

/**
 * Take an answer and say something useful back. The reply is where the
 * reasoning shows — accepting an answer silently would make this a form with
 * extra steps.
 */
export function applyAnswer(d: Draft, slot: SlotId, raw: string): { draft: Draft; reply: string } {
  const text = raw.trim();

  switch (slot) {
    case "objective": {
      const objective = (["Sales", "Leads", "Traffic", "Awareness"] as AdObjective[])
        .find((o) => text.toLowerCase().startsWith(o.toLowerCase())) ?? "Leads";
      return { draft: { ...d, objective }, reply: `${objective} it is.` };
    }

    case "platform": {
      const platform: AdPlatform = /meta|facebook|insta/i.test(text) ? "Meta" : "Google";
      return { draft: { ...d, platform }, reply: `${platform}.` };
    }

    case "tracking": {
      const on = yes(text);
      return {
        draft: { ...d, hasTracking: on },
        reply: on
          ? "Good — that keeps the automated types on the table."
          : "Then I will keep us on a type that does not depend on it. Worth fixing before you scale this, because it caps what any of it can do.",
      };
    }

    case "feed": {
      const on = yes(text);
      const next = { ...d, hasFeed: on };
      const rec = recommendType(next.platform!, next.objective!, on, next.hasTracking!);
      return {
        draft: { ...next, type: rec.type },
        reply:
          `So: **${rec.type}**.\n\n${rec.why}` +
          (rec.instead ? `\n\nI would switch to ${rec.instead.type} when ${rec.instead.when}.` : ""),
      };
    }

    case "targetCpa": {
      const targetCpa = money(text);
      if (!targetCpa) return { draft: d, reply: "Give me a number — even a rough one." };
      return { draft: { ...d, targetCpa }, reply: `${usd(targetCpa)} a ${d.objective === "Sales" ? "sale" : "lead"}.` };
    }

    case "dailyBudget": {
      const dailyBudget = money(text);
      if (!dailyBudget) return { draft: d, reply: "A number, in dollars a day." };
      const v = judgeBudget(d.platform!, dailyBudget, d.targetCpa!);
      return {
        draft: { ...d, dailyBudget, budgetSettled: v.ok },
        reply: v.ok ? v.note : "Let me check that against what the platform needs.",
      };
    }

    case "budgetCheck": {
      const v = judgeBudget(d.platform!, d.dailyBudget!, d.targetCpa!);
      if (/raise/i.test(text)) {
        return {
          draft: { ...d, dailyBudget: v.floor, budgetSettled: true },
          reply: `${usd(v.floor)} a day. That is enough for bidding to settle, which is the whole point of the number.`,
        };
      }
      /* Keeping a budget below the floor does not mean paying more per
       * conversion — it means the only conversions that budget can buy enough
       * of are cheaper ones. Saying "accept a higher cost" would be backwards
       * and would set a target the campaign still cannot hit. */
      const implied = Math.max(
        1,
        Math.floor(v.floor > 0 ? (d.dailyBudget! * d.targetCpa!) / v.floor : d.targetCpa!),
      );
      return {
        draft: { ...d, targetCpa: implied, budgetSettled: true },
        reply:
          `Then the arithmetic only works if each one costs about ${usd(implied)} rather than ${usd(d.targetCpa!)} — ` +
          `that is the most ${usd(d.dailyBudget!)} a day can buy enough of.\n\n` +
          `In practice that means optimising for something cheaper than a ${d.objective === "Sales" ? "sale" : "qualified lead"}: ` +
          `a form fill or a call booking. If it has to be the real thing, the budget is what has to move.`,
      };
    }

    case "geo":
      return { draft: { ...d, geo: text }, reply: text ? `${text}.` : "" };

    case "audience":
      return { draft: { ...d, audience: text }, reply: "Noted." };

    case "service": {
      const assets = draftAssets(d.platform!, d.objective!, text);
      return {
        draft: { ...d, service: text, ...assets },
        reply: `I have written ${assets.headlines.length} headlines and ${assets.descriptions.length} descriptions, all inside ${d.platform}'s character limits. They are on the right — edit anything that does not sound like you.`,
      };
    }

    case "name":
      return { draft: { ...d, name: text }, reply: "Done. Have a look and start it when you are happy." };

    default:
      return { draft: d, reply: "" };
  }
}
