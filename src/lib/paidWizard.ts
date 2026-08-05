import { LIMITS } from "../data/paid";
import type { AdObjective, AdPlatform, Campaign, CampaignType } from "../data/types";
import { budgetFloor, usd } from "./paidMetrics";

export interface Recommendation {
  type: CampaignType;
  why: string;
  /** Runner-up, with the condition that would make it the right call. */
  instead?: { type: CampaignType; when: string };
}

/**
 * Pick the campaign type from what the business actually wants.
 *
 * The rules that matter are about signal, not preference: automated types need
 * conversion data to bid on, and without it they spend the budget learning
 * something you already know. So tracking is checked before anything else.
 */
export function recommendType(
  platform: AdPlatform,
  objective: AdObjective,
  hasFeed: boolean,
  hasTracking: boolean,
): Recommendation {
  if (platform === "Google") {
    if (!hasTracking) {
      return {
        type: "Search",
        why: "No conversion tracking yet. Automated bidding has nothing to optimise towards, so Search on high-intent keywords is the only type that behaves predictably until tracking is in.",
        instead: { type: "Performance Max", when: "conversion tracking is live" },
      };
    }
    if (objective === "Awareness") {
      return {
        type: "Demand Gen",
        why: "Awareness on Google means YouTube, Discover and Gmail placements. Demand Gen is the type built for them; Search cannot create demand that is not already being typed in.",
      };
    }
    if (objective === "Sales" && hasFeed) {
      return {
        type: "Performance Max",
        why: "A product feed is what PMax is for — it generates and places assets across every Google surface off the catalogue.",
      };
    }
    if (objective === "Leads") {
      return {
        type: "Search",
        why: "Lead generation for a services business lives on intent. Someone typing the problem into Google is worth more than someone shown an ad, and Search reaches them at that moment.",
        instead: { type: "Performance Max", when: "Search is capped out and you want more volume" },
      };
    }
    return {
      type: "Performance Max",
      why: "Sales without a feed still suits PMax — it will use the asset group across Search, Display, YouTube and Maps, and find pockets Search alone misses.",
      instead: { type: "Search", when: "you want tight control over which terms you pay for" },
    };
  }

  if (objective === "Sales" && hasFeed) {
    return {
      type: "Advantage+ Shopping",
      why: "With a catalogue connected, Advantage+ handles audience and placement itself and consistently beats hand-built ad sets on sales.",
    };
  }
  if (objective === "Leads") {
    return {
      type: "Lead form",
      why: "An on-platform form removes the landing page from the equation. Cheaper leads, lower intent — worth it when the follow-up is fast.",
      instead: { type: "Traffic", when: "the landing page already converts well" },
    };
  }
  if (objective === "Awareness") {
    return {
      type: "Awareness",
      why: "Optimises for reach and frequency rather than clicks. Only worth running when something downstream is set up to catch the demand it creates.",
    };
  }
  return {
    type: "Traffic",
    why: "Sends people to the page and optimises for landing-page views rather than raw clicks.",
  };
}

export interface BudgetVerdict {
  floor: number;
  ok: boolean;
  note: string;
}

export function judgeBudget(
  platform: AdPlatform,
  dailyBudget: number,
  targetCpa: number,
): BudgetVerdict {
  const floor = budgetFloor(platform, targetCpa);
  if (dailyBudget <= 0 || targetCpa <= 0) {
    return { floor, ok: false, note: "Set a daily budget and a target cost per conversion." };
  }
  if (dailyBudget < floor) {
    return {
      floor,
      ok: false,
      note: `At ${usd(targetCpa)} a conversion this needs about ${usd(floor)} a day to leave the learning phase. Below that the campaign never gets enough signal to bid well, and the money is spent finding that out.`,
    };
  }
  return {
    floor,
    ok: true,
    note: `${usd(dailyBudget)} a day buys roughly ${Math.floor(dailyBudget / targetCpa)} conversions a day at target — enough for bidding to settle.`,
  };
}

/** Character-limit check per asset, since over-length copy is truncated silently. */
export function checkAssets(platform: AdPlatform, headlines: string[], descriptions: string[]) {
  const lim = LIMITS[platform];
  const heads = headlines.filter((h) => h.trim());
  const descs = descriptions.filter((d) => d.trim());
  return {
    limits: lim,
    tooLongHeadlines: heads.filter((h) => h.length > lim.headline),
    tooLongDescriptions: descs.filter((d) => d.length > lim.description),
    needMoreHeadlines: Math.max(0, lim.minHeadlines - heads.length),
    needMoreDescriptions: Math.max(0, lim.minDescriptions - descs.length),
    ok:
      heads.length >= lim.minHeadlines &&
      descs.length >= lim.minDescriptions &&
      heads.every((h) => h.length <= lim.headline) &&
      descs.every((d) => d.length <= lim.description),
  };
}

/**
 * First-draft copy, written to the platform's character limit rather than
 * trimmed afterwards. Canned here; this is the function a model replaces.
 */
export function draftAssets(
  platform: AdPlatform,
  objective: AdObjective,
  service: string,
): Pick<Campaign, "headlines" | "descriptions"> {
  const s = service.trim() || "web design";
  const heads =
    objective === "Awareness"
      ? [`The studio behind the work`, `${s} that pays for itself`, `See the case studies`]
      : objective === "Sales"
        ? [`${s} that converts`, `Fixed scope, fixed price`, `Book a 15 minute call`]
        : [`${s} for growing teams`, `Free site audit`, `Where your enquiries leak`];

  const descs =
    objective === "Awareness"
      ? ["Case studies with the numbers left in. No retainer, no lock-in."]
      : [
          `We rebuild the pages your enquiries drop on. Ninety days, measurable lift.`,
          `Tell us the goal and we will show you what we would change first.`,
        ];

  const cap = LIMITS[platform];
  return {
    headlines: heads.map((h) => h.slice(0, cap.headline)),
    descriptions: descs.map((d) => d.slice(0, cap.description)),
  };
}
