import { LEARNING } from "../data/paid";
import type { AdMetrics, Campaign } from "../data/types";

/** Everything worth knowing is a ratio of two counters, so none of it is stored. */
export interface Derived {
  ctr: number;
  cpc: number;
  cpa: number;
  convRate: number;
  roas: number;
  dailySpend: number;
}

const safe = (a: number, b: number) => (b > 0 ? a / b : 0);

export function derive(m: AdMetrics): Derived {
  return {
    ctr: safe(m.clicks, m.impressions),
    cpc: safe(m.spend, m.clicks),
    cpa: safe(m.spend, m.conversions),
    convRate: safe(m.conversions, m.clicks),
    roas: safe(m.revenue, m.spend),
    dailySpend: safe(m.spend, m.days),
  };
}

/**
 * Whether the numbers can be trusted yet.
 *
 * Both platforms need a volume of conversions before their bidding settles,
 * and judging — or worse, editing — a campaign before that point restarts the
 * clock. Every diagnosis checks this first.
 */
export function learningStatus(c: Campaign) {
  const target = LEARNING[c.platform];
  const window = Math.min(c.metrics.days, target.days);
  const rate = window > 0 ? c.metrics.conversions / c.metrics.days : 0;
  const projected = Math.round(rate * target.days);
  return {
    needed: target.conversions,
    projected,
    windowDays: target.days,
    settled: projected >= target.conversions && c.metrics.days >= target.days,
  };
}

/**
 * The daily budget a target CPA implies. Under this the campaign cannot
 * physically buy enough conversions to leave the learning phase, whatever the
 * creative does.
 */
export function budgetFloor(platform: Campaign["platform"], targetCpa: number): number {
  const { conversions, days } = LEARNING[platform];
  return Math.ceil((conversions * targetCpa) / days);
}

/** Spending the whole budget every day means the auction wants more than it can get. */
export const isBudgetCapped = (c: Campaign) =>
  c.metrics.days > 0 && derive(c.metrics).dailySpend >= c.dailyBudget * 0.95;

export const pct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;
export const usd = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(n < 10 ? 2 : 0)}`;
