import { useState } from "react";
import { useNavigate } from "react-router";
import type { AdPlatform, CampaignState } from "../../data/types";
import { PageHeader } from "../../layout/PageHeader";
import { cx } from "../../lib/format";
import { diagnose } from "../../lib/paidDiagnose";
import { derive, pct, usd } from "../../lib/paidMetrics";
import { ROUTES } from "../../routes";
import { campaignsFor, leadsFor, paidLeads } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Card, Empty } from "../../ui/Feedback";
import { Pill, Thumb } from "../../ui/Pill";
import { Tabs } from "../../ui/Tabs";

const TH = "text-left text-[10.5px] text-muted uppercase tracking-[0.06em] font-medium px-[14px] py-[9px] border-b border-line whitespace-nowrap";
const TD = "px-[14px] py-[11px] border-b border-line2 text-[12.5px] align-middle";

const STATE_TONE: Record<CampaignState, string> = {
  Draft: "bg-stone text-muted",
  Learning: "bg-ambersoft text-amber",
  Active: "bg-greensoft text-green",
  Paused: "bg-stone text-muted",
  Ended: "bg-stone text-faint",
};

export function CampaignsPage() {
  const { state } = useCrm();
  const nav = useNavigate();
  const [platform, setPlatform] = useState<"all" | AdPlatform>("all");

  const rows = campaignsFor(state, platform, "all");
  const spend = rows.reduce((n, c) => n + c.metrics.spend, 0);
  const inCrm = paidLeads(state, platform).length;

  return (
    <>
      <PageHeader
        title="Paid media"
        sub={`${usd(spend)} spent · ${inCrm} leads in the CRM · ${inCrm ? usd(spend / inCrm) : "—"} each`}
        actions={
          <Button variant="primary" onClick={() => nav(ROUTES.paidNew)}>
            New campaign
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "all", label: "All", count: state.campaigns.length },
          { id: "Google", label: "Google", count: campaignsFor(state, "Google", "all").length },
          { id: "Meta", label: "Meta", count: campaignsFor(state, "Meta", "all").length },
        ]}
        active={platform}
        onChange={(id) => setPlatform(id as "all" | AdPlatform)}
      />

      <div className="flex-1 min-h-0 overflow-auto px-[22px] py-[18px]">
        <Card className="overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-hover">
                <th className={TH}>Campaign</th>
                <th className={TH}>State</th>
                <th className={TH}>Budget</th>
                <th className={TH}>Spend</th>
                <th className={TH}>Reported</th>
                <th className={TH}>Leads in CRM</th>
                <th className={TH}>Cost each</th>
                <th className={TH}>Needs attention</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const d = derive(c.metrics);
                const leads = leadsFor(state, c.id).length;
                const blockers = diagnose(c, leads).filter((f) => f.severity === "blocker").length;
                const overTarget = d.cpa > c.targetCpa && c.metrics.conversions > 0;
                const shortOfLeads = c.metrics.conversions >= 10 && leads / c.metrics.conversions < 0.6;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-hover cursor-pointer"
                    onClick={() => nav(ROUTES.paidCampaign(c.id))}
                  >
                    <td className={TD}>
                      <div className="flex items-center gap-[10px]">
                        <Thumb seed={c.platform + c.name} alt="" size={38} />
                        <div className="min-w-0">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-[11.5px] text-muted">
                            {c.platform} · {c.type} · {c.geo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      <Pill tone={STATE_TONE[c.state]}>{c.state}</Pill>
                    </td>
                    <td className={cx(TD, "n")}>{usd(c.dailyBudget)}/day</td>
                    <td className={cx(TD, "n")}>{usd(c.metrics.spend)}</td>
                    <td className={cx(TD, "n")}>
                      {c.metrics.conversions}
                      {c.metrics.clicks > 0 && (
                        <span className="text-muted"> · {pct(d.convRate, 1)}</span>
                      )}
                    </td>
                    <td className={cx(TD, "n", shortOfLeads && "text-danger")}>
                      {leads}
                      {c.metrics.conversions > 0 && (
                        <span className={shortOfLeads ? "" : "text-muted"}>
                          {" "}· {pct(leads / c.metrics.conversions, 0)}
                        </span>
                      )}
                    </td>
                    <td className={cx(TD, "n", overTarget && "text-danger")}>
                      {c.metrics.conversions ? usd(d.cpa) : "—"}
                    </td>
                    <td className={TD}>
                      {blockers > 0 ? (
                        <Pill tone="bg-dangersoft text-danger">
                          {blockers} {blockers === 1 ? "problem" : "problems"}
                        </Pill>
                      ) : (
                        <span className="text-[11.5px] text-faint">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>No campaigns on this platform yet.</Empty>}
        </Card>
      </div>
    </>
  );
}
