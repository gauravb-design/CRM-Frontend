import { CTR_FLOOR, FREQUENCY_CEILING, LANDING_FLOOR } from "../data/paid";
import type { Campaign } from "../data/types";
import { budgetFloor, derive, isBudgetCapped, learningStatus, pct, usd } from "./paidMetrics";

export interface Finding {
  id: string;
  severity: "blocker" | "warning" | "win";
  title: string;
  detail: string;
  /** A change the app can make itself, when there is an obvious one. */
  fix?: { label: string; patch: Partial<Campaign> };
}

/**
 * Read a campaign's numbers and say what is actually wrong with it.
 *
 * Ordered deliberately. Learning comes first because nothing below it can be
 * judged until bidding has settled, and the most common way to ruin a campaign
 * is to react to week-one numbers. Each finding names the figure it is reading
 * so it can be argued with, rather than asserting a verdict.
 */
export function diagnose(c: Campaign, leadsInCrm?: number): Finding[] {
  const out: Finding[] = [];
  const d = derive(c.metrics);
  const learning = learningStatus(c);
  const floor = budgetFloor(c.platform, c.targetCpa);

  if (c.state === "Draft") {
    out.push({
      id: "draft",
      severity: "warning",
      title: "Not live yet",
      detail: "Nothing spends and nothing is measured until this is started.",
    });
  }

  // 1 — is there enough money on the table to ever leave learning?
  if (c.dailyBudget < floor) {
    out.push({
      id: "budget-floor",
      severity: "blocker",
      title: `Budget cannot reach ${learning.needed} conversions`,
      detail:
        `${c.platform} needs about ${learning.needed} conversions per ${learning.windowDays} days before bidding settles. ` +
        `At a ${usd(c.targetCpa)} target that is ${usd(floor)} a day, and this is set to ${usd(c.dailyBudget)}. ` +
        `Either raise the budget or accept a higher cost per lead.`,
      fix: { label: `Raise to ${usd(floor)}/day`, patch: { dailyBudget: floor } },
    });
  }

  // 2 — nothing below here means anything until it has settled.
  if (!learning.settled && c.state !== "Draft") {
    out.push({
      id: "learning",
      severity: "warning",
      title: "Still learning — leave it alone",
      detail:
        `${c.metrics.conversions} conversions in ${c.metrics.days} days, tracking to about ` +
        `${learning.projected} per ${learning.windowDays}. Edits restart the learning phase, so the ` +
        `numbers below are indicative only.`,
    });
  }

  if (c.metrics.clicks < 50) {
    return out.length ? out : [{
      id: "thin",
      severity: "warning",
      title: "Too little data",
      detail: `${c.metrics.clicks} clicks so far. Nothing here is worth reading yet.`,
    }];
  }

  // 3 — the funnel, top to bottom. Each step blames a different thing.
  const ctrFloor = CTR_FLOOR[c.type];
  if (d.ctr < ctrFloor) {
    out.push({
      id: "ctr",
      severity: "warning",
      title: `Click-through is ${pct(d.ctr, 2)}`,
      detail:
        `${c.type} normally does around ${pct(ctrFloor, 1)}. When the click rate is the problem it is ` +
        `the creative or the targeting, not the landing page — the page has not been seen yet.`,
    });
  }

  if (d.ctr >= ctrFloor && d.convRate < LANDING_FLOOR) {
    out.push({
      id: "landing",
      severity: "warning",
      title: `People click but do not convert (${pct(d.convRate, 1)})`,
      detail:
        `The ad is working — ${pct(d.ctr, 2)} click-through — and then ${pct(1 - d.convRate, 0)} of them ` +
        `leave. That is the landing page or the offer, not the ad. Sending more traffic makes it worse.`,
    });
  }

  if (c.metrics.conversions > 0 && d.cpa > c.targetCpa * 1.25) {
    out.push({
      id: "cpa",
      severity: "blocker",
      title: `Cost per conversion is ${usd(d.cpa)} against a ${usd(c.targetCpa)} target`,
      detail:
        `${Math.round((d.cpa / c.targetCpa - 1) * 100)}% over. Narrow the geo or the audience before ` +
        `cutting budget — a smaller budget on the same targeting usually just buys fewer of the same leads.`,
    });
  }

  /* 4 — the gap between what the platform claims and what arrived.
   * This one matters more than any bidding tweak: a campaign can look healthy
   * on the dashboard while most of the leads never reach anyone. */
  if (leadsInCrm !== undefined && c.metrics.conversions >= 10) {
    const landed = leadsInCrm / c.metrics.conversions;
    if (landed < 0.6) {
      out.push({
        id: "lead-gap",
        severity: "blocker",
        title: `${c.platform} reports ${c.metrics.conversions} conversions, ${leadsInCrm} reached the CRM`,
        detail:
          `Only ${pct(landed, 0)} of them arrived. That gap is the form, the tracking tag or the ` +
          `handoff, not the ads — and until it is closed, more budget buys more leads nobody sees.`,
      });
    }
  }

  // 5 — platform-specific failure modes.
  if (c.platform === "Meta" && (c.metrics.frequency ?? 0) > FREQUENCY_CEILING) {
    out.push({
      id: "frequency",
      severity: "warning",
      title: `Frequency is ${c.metrics.frequency?.toFixed(1)}`,
      detail:
        `The same people have seen this more than ${FREQUENCY_CEILING} times in a week. Past that the ` +
        `cost climbs and the click rate falls whatever you bid. Widen the audience or refresh the creative.`,
    });
  }

  if (c.platform === "Google" && c.type === "Performance Max" && !c.hasFeed) {
    out.push({
      id: "pmax-feed",
      severity: "warning",
      title: "Performance Max without a feed",
      detail:
        "Without a product feed, PMax leans on the asset group alone and behaves close to Demand Gen. " +
        "For a services business that is fine, but Search usually beats it on high-intent terms.",
    });
  }

  // 5 — and what is going right, because that is where budget should move to.
  if (isBudgetCapped(c) && learning.settled && d.cpa > 0 && d.cpa <= c.targetCpa) {
    out.push({
      id: "capped",
      severity: "win",
      title: "Hitting the budget cap while under target",
      detail:
        `Spending ${usd(d.dailySpend)} of a ${usd(c.dailyBudget)} budget every day at ${usd(d.cpa)} per ` +
        `conversion. There is demand here you are not buying.`,
      fix: {
        label: `Raise to ${usd(Math.round(c.dailyBudget * 1.3))}/day`,
        patch: { dailyBudget: Math.round(c.dailyBudget * 1.3) },
      },
    });
  }

  if (c.metrics.revenue > 0 && d.roas >= 3) {
    out.push({
      id: "roas",
      severity: "win",
      title: `Returning ${d.roas.toFixed(1)}× on spend`,
      detail: `${usd(c.metrics.revenue)} attributed against ${usd(c.metrics.spend)}. This is the one to scale.`,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "healthy",
      severity: "win",
      title: "Nothing to fix",
      detail: `${pct(d.ctr, 2)} click-through, ${usd(d.cpa)} per conversion, inside target. Leave it running.`,
    });
  }

  return out;
}
