import { DAY, NOW } from "./contacts";
import type { AdPlatform, Campaign, CampaignType } from "./types";

/**
 * Character limits are the platforms' own, and assets over them are silently
 * truncated in the auction rather than rejected — which is why a wizard has to
 * count them rather than trust whoever pasted the copy in.
 */
export const LIMITS = {
  Google: { headline: 30, description: 90, minHeadlines: 3, minDescriptions: 2 },
  Meta: { headline: 40, description: 125, minHeadlines: 2, minDescriptions: 1 },
} as const;

/**
 * Learning-phase thresholds, straight from each platform's documentation.
 * Below these a campaign's numbers are noise and changing anything resets it.
 */
export const LEARNING = {
  /** Google smart bidding wants roughly this many conversions in 30 days. */
  Google: { conversions: 30, days: 30 },
  /** Meta wants 50 optimisation events per ad set per week. */
  Meta: { conversions: 50, days: 7 },
} as const;

/**
 * Click-through benchmarks by placement. Rules of thumb for a services
 * business, not guarantees — they exist so a diagnosis can say "below what
 * this placement normally does" rather than pick a number out of the air.
 */
export const CTR_FLOOR: Record<CampaignType, number> = {
  Search: 0.02,
  "Performance Max": 0.008,
  "Demand Gen": 0.005,
  "Advantage+ Shopping": 0.009,
  "Lead form": 0.008,
  Traffic: 0.008,
  Awareness: 0.004,
};

/** Above this on a cold audience the same people are seeing it too often. */
export const FREQUENCY_CEILING = 3;

/** A landing page converting below this is losing most of what it is sent. */
export const LANDING_FLOOR = 0.02;

export const TYPES_BY_PLATFORM: Record<AdPlatform, CampaignType[]> = {
  Google: ["Performance Max", "Search", "Demand Gen"],
  Meta: ["Advantage+ Shopping", "Lead form", "Traffic", "Awareness"],
};

/**
 * Leads that actually reached the CRM, as opposed to the conversions the
 * platform reports. The two never match exactly, and the size of the gap is
 * the most useful number on the page — it is the form, the tag or the handoff
 * losing people between the ad and here.
 */
export const PAID_LEAD_SEED: Array<{
  id: number;
  campaignId: number;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  daysAgo: number;
  status: "New" | "Contacted" | "Replied" | "Interested" | "Unqualified";
}> = [
  { id: 201, campaignId: 1, firstName: "Karim", lastName: "Bakhoum", company: "Bakhoum Interiors", title: "Owner", email: "karim@bakhoum.ae", daysAgo: 2, status: "Interested" },
  { id: 202, campaignId: 1, firstName: "Lina", lastName: "Sarraf", company: "Sarraf Clinics", title: "Marketing Lead", email: "lina@sarrafclinics.ae", daysAgo: 5, status: "Contacted" },
  { id: 203, campaignId: 1, firstName: "Tariq", lastName: "Nabil", company: "Nabil Motors", title: "Founder", email: "tariq@nabilmotors.ae", daysAgo: 9, status: "New" },
  { id: 204, campaignId: 1, firstName: "Rana", lastName: "Habib", company: "Habib Realty", title: "Director", email: "rana@habibrealty.ae", daysAgo: 14, status: "Unqualified" },
  { id: 205, campaignId: 2, firstName: "Joseph", lastName: "Adeyemi", company: "Adeyemi Group", title: "Managing Director", email: "joseph@adeyemigroup.com", daysAgo: 1, status: "Replied" },
  { id: 206, campaignId: 2, firstName: "Mei", lastName: "Chen", company: "Chen Logistics", title: "Head of Growth", email: "mei@chenlogistics.com", daysAgo: 4, status: "Contacted" },
  { id: 207, campaignId: 2, firstName: "Ahmed", lastName: "Sultan", company: "Sultan Foods", title: "Owner", email: "ahmed@sultanfoods.ae", daysAgo: 12, status: "Interested" },
  { id: 208, campaignId: 4, firstName: "Holly", lastName: "Prentice", company: "Prentice Home", title: "Ecommerce Manager", email: "holly@prenticehome.co.uk", daysAgo: 20, status: "New" },
  { id: 209, campaignId: 4, firstName: "Owen", lastName: "Davies", company: "Davies Cycles", title: "Founder", email: "owen@daviescycles.co.uk", daysAgo: 26, status: "Unqualified" },
];

export const seedCampaigns = (): Campaign[] => [
  {
    id: 1,
    platform: "Google",
    type: "Performance Max",
    name: "PMax — UAE web design",
    objective: "Leads",
    dailyBudget: 120,
    targetCpa: 90,
    geo: "United Arab Emirates",
    audience: "Business owners, 10–200 staff",
    landingUrl: "https://uiux.studio/web-design",
    hasFeed: false,
    hasTracking: true,
    headlines: ["Websites that convert", "UI/UX for growing teams", "Dubai web design studio"],
    descriptions: [
      "We rebuild the pages your enquiries drop on. Fixed scope, fixed price.",
      "Ninety days, measurable lift, no retainer lock-in.",
    ],
    state: "Active",
    startedAt: NOW - 34 * DAY,
    metrics: { impressions: 412_000, clicks: 3_540, spend: 3_980, conversions: 41, revenue: 61_000, days: 34 },
  },
  {
    id: 2,
    platform: "Google",
    type: "Search",
    name: "Search — brand",
    objective: "Leads",
    dailyBudget: 25,
    targetCpa: 40,
    geo: "United Arab Emirates",
    audience: "Brand terms",
    landingUrl: "https://uiux.studio",
    hasFeed: false,
    hasTracking: true,
    headlines: ["UIUX Studio", "Official site", "Talk to the team"],
    descriptions: ["The studio behind the work you were looking for.", "Book a fifteen minute call."],
    state: "Active",
    startedAt: NOW - 61 * DAY,
    metrics: { impressions: 18_400, clicks: 2_210, spend: 940, conversions: 58, revenue: 47_000, days: 61 },
  },
  {
    id: 3,
    platform: "Meta",
    type: "Awareness",
    name: "Meta — studio brand, Gulf",
    objective: "Awareness",
    dailyBudget: 40,
    targetCpa: 60,
    geo: "UAE, Saudi Arabia",
    audience: "Founders and marketing leads, 25–55",
    landingUrl: "https://uiux.studio/work",
    hasFeed: false,
    hasTracking: true,
    headlines: ["Design that pays for itself", "See the work"],
    descriptions: ["Case studies with the numbers left in."],
    state: "Learning",
    startedAt: NOW - 9 * DAY,
    metrics: { impressions: 96_000, clicks: 430, spend: 360, conversions: 4, revenue: 0, frequency: 3.8, days: 9 },
  },
  {
    id: 4,
    platform: "Meta",
    type: "Lead form",
    name: "Meta — free site audit",
    objective: "Leads",
    dailyBudget: 60,
    targetCpa: 45,
    geo: "United Kingdom",
    audience: "Ecommerce managers",
    landingUrl: "",
    hasFeed: false,
    hasTracking: true,
    headlines: ["Free site audit", "Where your checkout leaks"],
    descriptions: ["Two minutes, no call required. We send the findings by email."],
    state: "Paused",
    startedAt: NOW - 48 * DAY,
    metrics: { impressions: 231_000, clicks: 4_900, spend: 2_640, conversions: 22, revenue: 0, frequency: 2.1, days: 48 },
  },
];
