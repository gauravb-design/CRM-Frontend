import { CTR_FLOOR, LEARNING, LIMITS } from "../../src/data/paid";
import type { Campaign } from "../../src/data/types";
import { applyAnswer, nextPrompt, type Draft } from "../../src/lib/paidChat";
import { diagnose } from "../../src/lib/paidDiagnose";
import { budgetFloor, derive, learningStatus } from "../../src/lib/paidMetrics";
import { checkAssets, draftAssets, judgeBudget, recommendType } from "../../src/lib/paidWizard";
import { campaignById, campaignsFor, leadsFor, paidLeads } from "../../src/state/selectors";
import { S, ok, run } from "./harness";

const ids = (c: Campaign) => diagnose(c).map((f) => f.id);
const base = () => campaignById(S, 1)!;

/* ------------------------------------------------------------- derived */
{
  const d = derive({ impressions: 1000, clicks: 50, spend: 200, conversions: 4, revenue: 800, days: 10 });
  ok("ctr", d.ctr === 0.05, d.ctr);
  ok("cpc", d.cpc === 4, d.cpc);
  ok("cpa", d.cpa === 50, d.cpa);
  ok("conversion rate", d.convRate === 0.08, d.convRate);
  ok("roas", d.roas === 4, d.roas);
  ok("daily spend", d.dailySpend === 20, d.dailySpend);

  const zero = derive({ impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0, days: 0 });
  ok("no divide by zero", Object.values(zero).every((v) => v === 0), zero);
}

/* ------------------------------------------------------ budget arithmetic */
{
  // Google wants 30 conversions in 30 days, so the floor is one CPA per day.
  ok("Google floor is one CPA a day", budgetFloor("Google", 90) === 90, budgetFloor("Google", 90));
  // Meta wants 50 a week, which is over seven times the CPA per day.
  ok("Meta floor is much higher", budgetFloor("Meta", 90) === Math.ceil((50 * 90) / 7), budgetFloor("Meta", 90));
  ok("Meta demands more than Google", budgetFloor("Meta", 50) > budgetFloor("Google", 50));

  ok("a thin budget is refused", !judgeBudget("Google", 40, 90).ok);
  ok("and it says the floor", judgeBudget("Google", 40, 90).note.includes("$90"), judgeBudget("Google", 40, 90).note);
  ok("an adequate budget passes", judgeBudget("Google", 120, 90).ok);
  ok("zero is refused", !judgeBudget("Google", 0, 0).ok);
}

/* ------------------------------------------------- the recommendation rules */
{
  ok("NO TRACKING MEANS NO AUTOMATION",
    recommendType("Google", "Sales", true, false).type === "Search",
    recommendType("Google", "Sales", true, false).type);
  ok("and it explains why", /nothing to optimise/.test(recommendType("Google", "Sales", true, false).why));
  ok("tracking unlocks PMax", recommendType("Google", "Sales", true, true).type === "Performance Max");
  ok("Google awareness is Demand Gen", recommendType("Google", "Awareness", false, true).type === "Demand Gen");
  ok("Google leads favour Search intent", recommendType("Google", "Leads", false, true).type === "Search");
  ok("and offer PMax as the alternative",
    recommendType("Google", "Leads", false, true).instead?.type === "Performance Max");

  ok("Meta sales with a catalogue", recommendType("Meta", "Sales", true, true).type === "Advantage+ Shopping");
  ok("Meta leads use a lead form", recommendType("Meta", "Leads", false, true).type === "Lead form");
  ok("Meta awareness", recommendType("Meta", "Awareness", false, true).type === "Awareness");
  ok("every recommendation gives a reason",
    (["Sales", "Leads", "Traffic", "Awareness"] as const).every((o) =>
      recommendType("Meta", o, false, true).why.length > 40));
}

/* ------------------------------------------------------------- assets */
{
  const long = "x".repeat(50);
  const g = checkAssets("Google", [long, "ok", "fine"], ["a description"]);
  ok("over-length headline caught", g.tooLongHeadlines.length === 1);
  ok("Google wants two descriptions", g.needMoreDescriptions === 1, g.needMoreDescriptions);
  ok("not ok while short", !g.ok);

  const good = checkAssets("Google", ["one", "two", "three"], ["first", "second"]);
  ok("a complete set passes", good.ok);

  ok("Meta allows longer headlines", LIMITS.Meta.headline > LIMITS.Google.headline);

  const drafted = draftAssets("Google", "Leads", "web design");
  ok("drafts enough headlines", drafted.headlines.length >= LIMITS.Google.minHeadlines);
  ok("DRAFTS WITHIN THE CHARACTER LIMIT",
    drafted.headlines.every((h) => h.length <= LIMITS.Google.headline),
    drafted.headlines.map((h) => h.length));
  ok("drafted copy uses the service", drafted.headlines.join(" ").includes("web design"));
  ok("a drafted set is valid", checkAssets("Google", drafted.headlines, drafted.descriptions).ok);
}

/* --------------------------------------------------------- learning phase */
{
  const c = base();
  const l = learningStatus(c);
  ok("learning projects from the run rate", l.needed === LEARNING.Google.conversions);
  ok("a mature campaign has settled", l.settled, l);

  const young: Campaign = { ...c, metrics: { ...c.metrics, days: 5, conversions: 2 } };
  ok("a young campaign has not", !learningStatus(young).settled);
  ok("AND IT SAYS NOT TO TOUCH IT", ids(young).includes("learning"), ids(young));
}

/* ------------------------------------------------------------ diagnosis */
{
  const c = base();

  const starved: Campaign = { ...c, dailyBudget: 20, targetCpa: 90 };
  ok("a starved budget blocks", ids(starved).includes("budget-floor"));
  ok("and offers the fix", diagnose(starved).find((f) => f.id === "budget-floor")?.fix?.patch.dailyBudget === 90);

  const weakCtr: Campaign = {
    ...c, metrics: { ...c.metrics, impressions: 1_000_000, clicks: 900 },
  };
  ok("weak click-through is caught", ids(weakCtr).includes("ctr"));
  ok("and blames the creative, not the page",
    diagnose(weakCtr).find((f) => f.id === "ctr")!.detail.includes("not the landing page"));

  const leakyPage: Campaign = {
    ...c, metrics: { ...c.metrics, impressions: 100_000, clicks: 5_000, conversions: 20 },
  };
  ok("a leaky landing page is caught", ids(leakyPage).includes("landing"), ids(leakyPage));
  ok("ctr and landing never both fire",
    !(ids(weakCtr).includes("ctr") && ids(weakCtr).includes("landing")));

  const pricey: Campaign = { ...c, targetCpa: 20 };
  ok("cost over target blocks", ids(pricey).includes("cpa"));

  const meta = campaignById(S, 3)!;
  ok("Meta frequency is caught", ids(meta).includes("frequency"), ids(meta));
  ok("frequency is Google-silent", !ids(c).includes("frequency"));

  ok("PMax without a feed is flagged", ids(c).includes("pmax-feed"), ids(c));

  const thin: Campaign = {
    ...c, metrics: { impressions: 300, clicks: 9, spend: 20, conversions: 0, revenue: 0, days: 2 },
  };
  ok("thin data says so and stops", ids(thin).every((i) => ["learning", "thin", "budget-floor"].includes(i)), ids(thin));

  const draft: Campaign = { ...c, state: "Draft" };
  ok("a draft is flagged as not live", ids(draft).includes("draft"));

  const winner: Campaign = {
    ...c, hasFeed: true, targetCpa: 120,
    metrics: { ...c.metrics, spend: 120 * 34, conversions: 41, revenue: 61_000 },
  };
  ok("a capped winner is spotted", ids(winner).includes("capped"), ids(winner));
  ok("and offers to raise the budget",
    (diagnose(winner).find((f) => f.id === "capped")?.fix?.patch.dailyBudget ?? 0) > c.dailyBudget);

  ok("every finding has a detail", diagnose(c).every((f) => f.detail.length > 30));
  ok("every campaign type has a benchmark",
    S.campaigns.every((x) => typeof CTR_FLOOR[x.type] === "number"));
}

/* ------------------------------------------------------- the wizard chat */
{
  // Walk the whole conversation the way a user would, taking the first option
  // each time, and check it lands on a campaign that can actually be created.
  let d: Draft = {};
  const said: string[] = [];
  let guard = 0;

  while (nextPrompt(d).slot && guard++ < 20) {
    const p = nextPrompt(d);
    const reply = p.options?.[0] ?? { targetCpa: "90", dailyBudget: "120", geo: "UAE", audience: "Founders", service: "web design", name: "Test campaign" }[p.slot as string] ?? "x";
    const step = applyAnswer(d, p.slot!, reply);
    d = step.draft;
    said.push(step.reply);
  }

  ok("THE CONVERSATION TERMINATES", nextPrompt(d).slot === null, guard);
  ok("it asks about ten things", guard >= 8 && guard <= 12, guard);
  ok("every answer gets a reply", said.every((r) => r.length > 0));
  ok("it ends with a complete campaign",
    Boolean(d.platform && d.type && d.objective && d.name && d.dailyBudget && d.targetCpa), d);

  // The order is the point: tracking is asked before the type is decided.
  const order: string[] = [];
  let walk: Draft = {};
  while (nextPrompt(walk).slot && order.length < 20) {
    const p = nextPrompt(walk);
    order.push(p.slot!);
    walk = applyAnswer(walk, p.slot!, p.options?.[0] ?? "90").draft;
  }
  ok("goal is asked first", order[0] === "objective", order);
  ok("TRACKING IS ASKED BEFORE BUDGET",
    order.indexOf("tracking") < order.indexOf("targetCpa"), order);

  // No tracking must reach the recommendation, not just the form.
  const noTrack = applyAnswer(
    applyAnswer(applyAnswer({}, "objective", "Sales").draft, "platform", "Google").draft,
    "tracking", "No, not yet",
  ).draft;
  const decided = applyAnswer(noTrack, "feed", "Yes");
  ok("no tracking still rules out PMax", decided.draft.type === "Search", decided.draft.type);
  ok("and the reply explains it", decided.reply.includes("Search") && decided.reply.length > 60);

  // A short budget must be argued with, not accepted.
  const tight = applyAnswer(
    applyAnswer({ platform: "Meta", objective: "Leads", hasTracking: true, hasFeed: false, targetCpa: 90 },
      "dailyBudget", "50").draft,
    "dailyBudget", "50",
  ).draft;
  ok("A THIN BUDGET IS CHALLENGED", nextPrompt(tight).slot === "budgetCheck", nextPrompt(tight).slot);
  ok("and both ways out are offered", (nextPrompt(tight).options ?? []).length === 2);

  const raised = applyAnswer(tight, "budgetCheck", "Raise to $643 a day");
  ok("raising sets the floor", raised.draft.dailyBudget === budgetFloor("Meta", 90), raised.draft.dailyBudget);
  ok("and settles it", nextPrompt(raised.draft).slot !== "budgetCheck");

  /* Keeping a low budget forces a CHEAPER conversion, not a dearer one — the
   * budget can only buy enough of something that costs less. */
  const kept = applyAnswer(tight, "budgetCheck", "Keep $50 a day");
  ok("KEEPING THE BUDGET LOWERS THE IMPLIED COST", kept.draft.targetCpa! < 90, kept.draft.targetCpa);
  ok("the budget is left alone", kept.draft.dailyBudget === 50);
  ok("and it names the trade", /cheaper than/.test(kept.reply), kept.reply);
  ok("it is settled either way", nextPrompt(kept.draft).slot !== "budgetCheck");

  // Naming the service writes the copy.
  const withCopy = applyAnswer(
    { platform: "Google", objective: "Leads", hasTracking: true, hasFeed: false },
    "service", "web design",
  );
  ok("the service writes the copy", (withCopy.draft.headlines ?? []).length >= 3);
  ok("WRITTEN INSIDE THE CHARACTER LIMIT",
    checkAssets("Google", withCopy.draft.headlines!, withCopy.draft.descriptions!).ok);

  ok("junk numbers are refused", applyAnswer({ objective: "Leads" }, "targetCpa", "lots").draft.targetCpa === undefined);
  ok("and it asks again", /number/.test(applyAnswer({ objective: "Leads" }, "targetCpa", "lots").reply));
  ok("dollar signs parse", applyAnswer({ objective: "Leads" }, "targetCpa", "$1,200").draft.targetCpa === 1200);
}

/* -------------------------------------------------------------- reducer */
{
  const created = run(S, {
    type: "createCampaign",
    start: false,
    campaign: {
      platform: "Meta", type: "Lead form", name: "Meta — audit", objective: "Leads",
      dailyBudget: 300, targetCpa: 40, geo: "UK", audience: "Ecom", landingUrl: "",
      hasFeed: false, hasTracking: true, headlines: ["a", "b"], descriptions: ["c"],
    },
  });
  ok("campaign created", created.campaigns.length === S.campaigns.length + 1);
  const made = created.campaigns[created.campaigns.length - 1];
  ok("a saved campaign is a draft", made.state === "Draft" && made.startedAt === null);
  ok("it starts with no metrics", made.metrics.spend === 0 && made.metrics.days === 0);

  const { id: _id, state: _st, startedAt: _at, metrics: _m, ...draftShape } = made;
  const started = run(S, { type: "createCampaign", start: true, campaign: draftShape });
  ok("STARTING GOES TO LEARNING, NOT ACTIVE",
    started.campaigns[started.campaigns.length - 1].state === "Learning");

  const paused = run(S, { type: "setCampaignState", id: 1, state: "Paused" });
  ok("pausing works", campaignById(paused, 1)!.state === "Paused");
  ok("and warns about the reset", /resets the learning phase/.test(paused.toast), paused.toast);

  const restarted = run(S, { type: "setCampaignState", id: 4, state: "Active" });
  ok("restarting something already run stays Active",
    campaignById(restarted, 4)!.state === "Active", campaignById(restarted, 4)!.state);

  const fixed = run(S, { type: "applyFix", id: 3, label: "Raise to $60/day", patch: { dailyBudget: 60 } });
  ok("a fix applies", campaignById(fixed, 3)!.dailyBudget === 60);
  ok("and says it restarts learning", /restarts the learning phase/.test(fixed.toast), fixed.toast);

  ok("filtering by platform is one pass",
    campaignsFor(S, "Meta", "all").every((c) => c.platform === "Meta"));
  ok("filtering by state works", campaignsFor(S, "all", "Paused").every((c) => c.state === "Paused"));
}

/* ---------------------------------------------------------------- leads */
{
  const leads = leadsFor(S, 1);
  ok("leads are attributed to their campaign", leads.length === 4, leads.length);
  ok("every lead knows its campaign", leads.every((l) => l.campaignId === 1));
  ok("leads are newest first", leads.every((l, i) => i === 0 || leads[i - 1].createdAt >= l.createdAt));
  ok("leads carry the platform as their source", leads.every((l) => l.source === "Google Ads"));

  ok("platform totals add up",
    paidLeads(S, "Google").length + paidLeads(S, "Meta").length === paidLeads(S, "all").length);
  ok("Meta leads come from Meta campaigns",
    paidLeads(S, "Meta").every((l) => campaignById(S, l.campaignId!)!.platform === "Meta"));
  ok("a campaign with no leads returns none", leadsFor(S, 3).length === 0);

  // The gap between what the platform claims and what arrived.
  const c1 = campaignById(S, 1)!;
  ok("REPORTED AND LANDED ARE COMPARED", diagnose(c1, 4).map((f) => f.id).includes("lead-gap"));
  ok("the finding names both numbers", (() => {
    const f = diagnose(c1, 4).find((x) => x.id === "lead-gap")!;
    return f.title.includes("41") && f.title.includes("4");
  })());
  ok("no gap flagged when they match", !diagnose(c1, 40).map((f) => f.id).includes("lead-gap"));
  ok("no gap flagged without lead data", !diagnose(c1).map((f) => f.id).includes("lead-gap"));
  ok("thin conversion counts are not judged",
    !diagnose({ ...c1, metrics: { ...c1.metrics, conversions: 5 } }, 1).map((f) => f.id).includes("lead-gap"));

  // Paid leads must not leak into the outbound machinery.
  ok("paid leads are not sequenced", paidLeads(S, "all").every((l) => l.seqId === 0));
  ok("paid leads are not in the LinkedIn queue", paidLeads(S, "all").every((l) => l.li === "none"));
  ok("contact ids stay unique across every source",
    new Set(S.contacts.map((c) => c.id)).size === S.contacts.length, S.contacts.length);
}
