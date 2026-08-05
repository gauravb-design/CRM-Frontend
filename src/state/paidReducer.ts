import { NOW } from "../data/contacts";
import type { Campaign } from "../data/types";
import { usd } from "../lib/paidMetrics";
import type { Action, CrmState } from "./types";

type PaidAction = Extract<
  Action,
  | { type: "createCampaign" } | { type: "saveCampaign" }
  | { type: "setCampaignState" } | { type: "applyFix" }
>;

const PAID_TYPES = new Set(["createCampaign", "saveCampaign", "setCampaignState", "applyFix"]);

export const isPaidAction = (a: Action): a is PaidAction => PAID_TYPES.has(a.type);

const patch = (rows: Campaign[], id: number, p: Partial<Campaign>) =>
  rows.map((c) => (c.id === id ? { ...c, ...p } : c));

export function paidReducer(s: CrmState, a: PaidAction): CrmState {
  switch (a.type) {
    case "createCampaign": {
      const id = Math.max(0, ...s.campaigns.map((c) => c.id)) + 1;
      const live = a.start;
      return {
        ...s,
        campaigns: [
          ...s.campaigns,
          {
            ...a.campaign,
            id,
            state: live ? "Learning" : "Draft",
            startedAt: live ? NOW : null,
            metrics: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0, days: 0 },
          },
        ],
        toast: live
          ? `${a.campaign.name} is live at ${usd(a.campaign.dailyBudget)} a day.`
          : `${a.campaign.name} saved as a draft.`,
      };
    }

    case "saveCampaign":
      return { ...s, campaigns: patch(s.campaigns, a.id, a.patch), toast: "Campaign saved." };

    case "setCampaignState": {
      const c = s.campaigns.find((x) => x.id === a.id);
      if (!c) return s;
      /* Starting something that has never run puts it back in learning, not
       * straight to active — the platform restarts the phase either way, and
       * showing Active would claim numbers that are not there. */
      const started = a.state === "Active" && c.startedAt === null;
      return {
        ...s,
        campaigns: patch(s.campaigns, a.id, {
          state: started ? "Learning" : a.state,
          startedAt: c.startedAt ?? (a.state === "Active" ? NOW : null),
        }),
        toast:
          a.state === "Paused"
            ? `${c.name} paused. Restarting it resets the learning phase.`
            : `${c.name} is ${started ? "learning" : a.state.toLowerCase()}.`,
      };
    }

    /* One-click application of a diagnosis. The finding already computed the
     * change; this only records it and says what moved. */
    case "applyFix": {
      const c = s.campaigns.find((x) => x.id === a.id);
      if (!c) return s;
      return {
        ...s,
        campaigns: patch(s.campaigns, a.id, a.patch),
        toast: `${a.label} — applied to ${c.name}. This restarts the learning phase.`,
      };
    }
  }
}
