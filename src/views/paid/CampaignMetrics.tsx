import type { Campaign } from "../../data/types";
import { cx } from "../../lib/format";
import { derive, learningStatus, pct, usd } from "../../lib/paidMetrics";
import { Card } from "../../ui/Feedback";
import { Label } from "../../ui/Pill";

function Tile({ k, v, note, tone }: { k: string; v: string; note?: string; tone?: string }) {
  return (
    <Card className="px-[15px] py-[13px]">
      <Label>{k}</Label>
      <div className={cx("n text-[20px] mt-[5px]", tone)}>{v}</div>
      {note && <div className="text-[11px] text-muted mt-[3px] leading-snug">{note}</div>}
    </Card>
  );
}

/** The six numbers worth looking at, and how far through learning it is. */
export function CampaignMetrics({ campaign: c }: { campaign: Campaign }) {
  const d = derive(c.metrics);
  const learn = learningStatus(c);
  const overTarget = c.metrics.conversions > 0 && d.cpa > c.targetCpa;
  const progress = Math.min(100, (learn.projected / learn.needed) * 100);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Tile k="Spend" v={usd(c.metrics.spend)} note={`${usd(d.dailySpend)} a day of ${usd(c.dailyBudget)}`} />
        <Tile k="Conversions" v={String(c.metrics.conversions)} note={`over ${c.metrics.days} days`} />
        <Tile
          k="Cost each"
          v={c.metrics.conversions ? usd(d.cpa) : "—"}
          note={`target ${usd(c.targetCpa)}`}
          tone={overTarget ? "text-danger" : undefined}
        />
        <Tile k="Click-through" v={pct(d.ctr, 2)} note={`${c.metrics.clicks.toLocaleString()} clicks`} />
        <Tile k="Click to conversion" v={pct(d.convRate, 1)} note={`${usd(d.cpc)} a click`} />
        <Tile
          k="Return on spend"
          v={c.metrics.revenue ? `${d.roas.toFixed(1)}×` : "—"}
          note={c.metrics.revenue ? usd(c.metrics.revenue) + " attributed" : "no revenue tracked"}
        />
      </div>

      {!learn.settled && c.state !== "Draft" && (
        <Card className="px-[15px] py-[13px] mt-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Label>Learning phase</Label>
            <span className="n text-[11.5px] text-muted">
              tracking to {learn.projected} of {learn.needed} per {learn.windowDays} days
            </span>
          </div>
          <div className="h-[6px] bg-line2 rounded-[3px] overflow-hidden mt-[8px]">
            <div className="h-full bg-amber" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11.5px] text-muted leading-relaxed mt-[7px]">
            Bidding has not settled. Every edit restarts this, so change one thing at a time and
            only when a finding below says to.
          </p>
        </Card>
      )}
    </>
  );
}
