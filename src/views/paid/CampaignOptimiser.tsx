import type { Campaign } from "../../data/types";
import { cx } from "../../lib/format";
import { diagnose, type Finding } from "../../lib/paidDiagnose";
import { leadsFor } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Feedback";

const TONE: Record<Finding["severity"], { dot: string; label: string }> = {
  blocker: { dot: "bg-danger", label: "text-danger" },
  warning: { dot: "bg-amber", label: "text-amber" },
  win: { dot: "bg-green", label: "text-green" },
};

/**
 * Everything the numbers say, in the order it should be acted on. Findings
 * that have an obvious change carry the button that makes it — and say that
 * applying it restarts learning, because it does.
 */
export function CampaignOptimiser({ campaign: c }: { campaign: Campaign }) {
  const { state, dispatch } = useCrm();
  // The lead count is passed in so the diagnosis can compare what the platform
  // claims against what actually landed.
  const findings = diagnose(c, leadsFor(state, c.id).length);

  return (
    <>
      {findings.map((f) => (
        <Card key={f.id} className="px-[15px] py-[13px] mb-[9px]">
          <div className="flex items-start gap-[10px]">
            <span className={cx("w-[7px] h-[7px] rounded-full shrink-0 mt-[6px]", TONE[f.severity].dot)} />
            <div className="min-w-0 flex-1">
              <div className={cx("text-[12.5px] font-medium", TONE[f.severity].label)}>{f.title}</div>
              <p className="text-[12px] text-ink2 leading-relaxed mt-[4px]">{f.detail}</p>

              {f.fix && (
                <div className="flex items-center gap-2 mt-[10px] flex-wrap">
                  <Button
                    small
                    variant="primary"
                    onClick={() =>
                      dispatch({ type: "applyFix", id: c.id, label: f.fix!.label, patch: f.fix!.patch })
                    }
                  >
                    {f.fix.label}
                  </Button>
                  <span className="text-[11px] text-faint">Restarts the learning phase.</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
