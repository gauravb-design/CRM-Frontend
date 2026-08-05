import { useNavigate, useParams } from "react-router";
import { PageHeader } from "../../layout/PageHeader";
import { usd } from "../../lib/paidMetrics";
import { ROUTES } from "../../routes";
import { campaignById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Feedback";
import { Label, Pill } from "../../ui/Pill";
import { CampaignLeads } from "./CampaignLeads";
import { CampaignMetrics } from "./CampaignMetrics";
import { CampaignOptimiser } from "./CampaignOptimiser";

export function CampaignPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const { id } = useParams();
  const c = campaignById(state, Number(id));

  if (!c) {
    return (
      <>
        <PageHeader title="Campaign not found" sub="It may have been removed" />
        <div className="p-6">
          <Button onClick={() => nav(ROUTES.paid)}>Back to campaigns</Button>
        </div>
      </>
    );
  }

  const running = c.state === "Active" || c.state === "Learning";

  return (
    <>
      <PageHeader
        title={c.name}
        sub={`${c.platform} · ${c.type} · ${c.geo} · ${usd(c.dailyBudget)} a day`}
        actions={
          <>
            <Pill tone={running ? "bg-greensoft text-green" : "bg-stone text-muted"}>{c.state}</Pill>
            <Button
              onClick={() =>
                dispatch({ type: "setCampaignState", id: c.id, state: running ? "Paused" : "Active" })
              }
            >
              {running ? "Pause" : "Start"}
            </Button>
            <Button onClick={() => nav(ROUTES.paid)}>Back</Button>
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-[22px] py-[18px]">
        <div className="grid grid-cols-[1fr_380px] gap-4 items-start">
          <div className="min-w-0">
            <CampaignMetrics campaign={c} />

            <div className="mt-5">
              <Label className="mb-[10px]">What the numbers say</Label>
              <CampaignOptimiser campaign={c} />
            </div>

            <div className="mt-5">
              <CampaignLeads campaign={c} />
            </div>
          </div>

          <Card className="px-[15px] py-[14px]">
            <Label className="mb-[10px]">Setup</Label>
            {[
              ["Objective", c.objective],
              ["Audience", c.audience],
              ["Target cost", `${usd(c.targetCpa)} a conversion`],
              ["Landing page", c.landingUrl || "On-platform form"],
              ["Product feed", c.hasFeed ? "Connected" : "None"],
              ["Conversion tracking", c.hasTracking ? "Live" : "Not set up"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-[10px] mb-[9px]">
                <span className="text-[11.5px] text-faint w-[110px] shrink-0">{k}</span>
                <span className="text-[11.5px] text-ink2 min-w-0 break-words">{v}</span>
              </div>
            ))}

            <div className="h-px bg-line2 my-[14px]" />
            <Label className="mb-[8px]">Headlines</Label>
            {c.headlines.map((h, i) => (
              <div key={i} className="text-[12px] text-ink2 leading-snug mb-[6px]">
                {h}
                <span className="n text-faint"> · {h.length}</span>
              </div>
            ))}

            <div className="h-px bg-line2 my-[14px]" />
            <Label className="mb-[8px]">Descriptions</Label>
            {c.descriptions.map((d, i) => (
              <div key={i} className="text-[12px] text-ink2 leading-relaxed mb-[7px]">
                {d}
                <span className="n text-faint"> · {d.length}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
