import { STAGES } from "../data/pipeline";
import type { DealStage } from "../data/types";
import { PageHeader } from "../layout/PageHeader";
import { daysSince, fullName, money } from "../lib/format";
import { contactById } from "../state/selectors";
import { useCrm } from "../state/store";
import { Button } from "../ui/Button";
import { Card } from "../ui/Feedback";

export function Deals() {
  const { state, dispatch } = useCrm();
  const openValue = state.deals
    .filter((d) => d.stage !== "Lost")
    .reduce((n, d) => n + d.value, 0);

  return (
    <>
      <PageHeader
        title="Deals"
        sub={`${money(openValue)} open across ${state.deals.length} deals`}
        actions={
          <Button
            onClick={() =>
              dispatch({
                type: "toast",
                text: "Deals are created from a reply, so the contact comes with it.",
              })
            }
          >
            New deal
          </Button>
        }
      />

      {/* Wide boards scroll inside their own container so the page never does. */}
      <div className="flex-1 min-h-0 overflow-auto px-[22px] py-[18px]">
        <div className="flex gap-[13px] min-w-min">
          {STAGES.map((stage) => {
            const inStage = state.deals.filter((d) => d.stage === stage);
            const total = inStage.reduce((n, d) => n + d.value, 0);

            return (
              <div key={stage} className="w-[252px] shrink-0">
                <div className="flex items-baseline gap-[7px] px-[3px] pb-[9px]">
                  <span className="text-[12.5px] font-medium">{stage}</span>
                  <span className="n text-[11px] text-muted bg-line2 rounded-[9px] px-[7px] py-px">
                    {inStage.length}
                  </span>
                  <div className="flex-1" />
                  {inStage.length > 0 && (
                    <span className="n text-[11.5px] text-muted">{money(total)}</span>
                  )}
                </div>

                {inStage.map((d) => {
                  const c = contactById(state, d.cid);
                  if (!c) return null;
                  return (
                    <Card key={d.id} className="px-[13px] py-3 mb-[9px]">
                      <div className="text-[12.5px] font-medium">{c.company}</div>
                      <div className="text-[11.5px] text-muted mt-[2px]">
                        {fullName(c)} · {c.owner}
                      </div>
                      <div className="flex items-baseline gap-2 mt-[9px]">
                        <span className="n text-sm">{money(d.value)}</span>
                        <div className="flex-1" />
                        <span className="n text-[10.5px] text-faint">
                          {Math.max(1, daysSince(d.at))}d
                        </span>
                      </div>
                      <select
                        className="chev w-full mt-[10px] border border-line rounded-md px-[9px] py-[5px] text-[11.5px] cursor-pointer"
                        value={d.stage}
                        onChange={(e) =>
                          dispatch({ type: "moveDeal", id: d.id, stage: e.target.value as DealStage })
                        }
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Card>
                  );
                })}

                {inStage.length === 0 && (
                  <div className="border border-dashed border-[#dfdcd5] rounded-[10px] px-3 py-[18px] text-center text-[11.5px] text-faint">
                    Nothing here
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
