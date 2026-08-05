import { cx } from "../../lib/format";
import type { Draft } from "../../lib/paidChat";
import { usd } from "../../lib/paidMetrics";
import { checkAssets, judgeBudget } from "../../lib/paidWizard";
import { Card, Notice } from "../../ui/Feedback";
import { inputCls } from "../../ui/Field";
import { Label } from "../../ui/Pill";

const PENDING = "—";

function Row({ k, v, filled }: { k: string; v: string; filled: boolean }) {
  return (
    <div className="flex gap-[10px] mb-[9px]">
      <span className="text-[11.5px] text-faint w-[104px] shrink-0">{k}</span>
      <span className={cx("text-[11.5px] min-w-0 break-words", filled ? "text-ink2" : "text-faint")}>
        {v}
      </span>
    </div>
  );
}

/**
 * The campaign as it stands, filling in as the conversation goes. Editable
 * where it matters — the copy is the one thing a person will always want to
 * change, and making them ask the chat to reword it would be worse than a box.
 */
export function CampaignPreview({ draft: d, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const budget =
    d.platform && d.dailyBudget && d.targetCpa
      ? judgeBudget(d.platform, d.dailyBudget, d.targetCpa)
      : null;
  const assets =
    d.platform && d.headlines
      ? checkAssets(d.platform, d.headlines, d.descriptions ?? [])
      : null;

  const setAt = (key: "headlines" | "descriptions", i: number, text: string) =>
    onChange({ ...d, [key]: (d[key] ?? []).map((x, n) => (n === i ? text : x)) });

  return (
    <div className="flex-1 min-w-0 overflow-y-auto px-6 py-5">
      <div className="max-w-[560px]">
        <Card className="px-[15px] py-[14px]">
          <Label className="mb-[10px]">The campaign so far</Label>
          <Row k="Name" v={d.name ?? PENDING} filled={Boolean(d.name)} />
          <Row k="Platform" v={d.platform ?? PENDING} filled={Boolean(d.platform)} />
          <Row k="Type" v={d.type ?? PENDING} filled={Boolean(d.type)} />
          <Row k="For" v={d.objective ?? PENDING} filled={Boolean(d.objective)} />
          <Row
            k="Budget"
            v={d.dailyBudget ? `${usd(d.dailyBudget)} a day · ${usd(d.dailyBudget * 30)} a month` : PENDING}
            filled={Boolean(d.dailyBudget)}
          />
          <Row
            k="Target cost"
            v={d.targetCpa ? `${usd(d.targetCpa)} each` : PENDING}
            filled={Boolean(d.targetCpa)}
          />
          <Row k="Where" v={d.geo ?? PENDING} filled={Boolean(d.geo)} />
          <Row k="Who" v={d.audience ?? PENDING} filled={Boolean(d.audience)} />
          <Row
            k="Tracking"
            v={d.hasTracking === undefined ? PENDING : d.hasTracking ? "Live" : "Not set up"}
            filled={d.hasTracking !== undefined}
          />
          <Row
            k="Feed"
            v={d.hasFeed === undefined ? PENDING : d.hasFeed ? "Connected" : "None"}
            filled={d.hasFeed !== undefined}
          />
        </Card>

        {budget && !budget.ok && (
          <div className="mt-3">
            <Notice>{budget.note}</Notice>
          </div>
        )}

        {d.headlines && assets && (
          <Card className="px-[15px] py-[14px] mt-3">
            <div className="flex items-baseline gap-2 mb-[10px]">
              <Label>Copy</Label>
              <span className="text-[11px] text-faint">
                written for {d.platform} · headlines {assets.limits.headline}, descriptions{" "}
                {assets.limits.description}
              </span>
            </div>

            {d.headlines.map((h, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  className={cx(inputCls, h.length > assets.limits.headline && "border-danger")}
                  value={h}
                  onChange={(e) => setAt("headlines", i, e.target.value)}
                />
                <span
                  className={cx(
                    "n text-[11px] w-[44px] shrink-0 text-right",
                    h.length > assets.limits.headline ? "text-danger" : "text-faint",
                  )}
                >
                  {h.length}/{assets.limits.headline}
                </span>
              </div>
            ))}

            <div className="h-px bg-line2 my-[12px]" />

            {(d.descriptions ?? []).map((x, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <textarea
                  className={cx(
                    inputCls,
                    "min-h-[54px] leading-relaxed resize-y",
                    x.length > assets.limits.description && "border-danger",
                  )}
                  value={x}
                  onChange={(e) => setAt("descriptions", i, e.target.value)}
                />
                <span
                  className={cx(
                    "n text-[11px] w-[44px] shrink-0 text-right pt-[9px]",
                    x.length > assets.limits.description ? "text-danger" : "text-faint",
                  )}
                >
                  {x.length}/{assets.limits.description}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
