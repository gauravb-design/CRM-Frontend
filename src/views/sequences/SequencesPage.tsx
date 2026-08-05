import { useState } from "react";
import { useNavigate } from "react-router";
import { isManual } from "../../data/types";
import { PageHeader } from "../../layout/PageHeader";
import { CHANNEL_PILL } from "../../lib/tokens";
import { ROUTES } from "../../routes";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Card, Empty } from "../../ui/Feedback";
import { Confirm } from "../../ui/Modal";
import { Pill } from "../../ui/Pill";

export function SequencesPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const [deleting, setDeleting] = useState<number | null>(null);

  const target = state.sequences.find((q) => q.id === deleting);

  return (
    <>
      <PageHeader
        title="Sequences"
        sub={`${state.sequences.length} sequences · LinkedIn steps are always done by hand`}
        actions={
          <Button variant="primary" onClick={() => nav(ROUTES.sequenceNew)}>
            New sequence
          </Button>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-[22px] py-[18px]">
        <div className="max-w-[880px]">
          {state.sequences.length === 0 && (
            <Empty dashed>No sequences yet. Build one and enrol a list into it.</Empty>
          )}

          {state.sequences.map((q) => {
            const enrolled = state.contacts.filter((c) => c.seqId === q.id).length;
            const replied = state.contacts.filter(
              (c) => c.seqId === q.id && (c.status === "Replied" || c.status === "Interested"),
            ).length;
            const lastDay = q.steps.length ? Math.max(...q.steps.map((s) => s.delayDays)) : 0;

            return (
              <Card key={q.id} className="px-[18px] py-4 mb-3">
                <div className="flex items-center gap-[10px] flex-wrap">
                  <span className="text-[14px] font-semibold">{q.name}</span>
                  <Pill tone={q.active ? "bg-greensoft text-green" : "bg-stone text-muted"}>
                    {q.active ? "Active" : "Paused"}
                  </Pill>
                  <div className="flex-1" />
                  <Button small onClick={() => dispatch({ type: "toggleSequence", id: q.id })}>
                    {q.active ? "Pause" : "Resume"}
                  </Button>
                  <Button small onClick={() => nav(ROUTES.sequence(q.id))}>
                    Edit
                  </Button>
                  <Button small onClick={() => setDeleting(q.id)}>
                    Delete
                  </Button>
                </div>

                <p className="text-xs text-muted leading-relaxed mt-[6px]">{q.note}</p>

                <div className="flex gap-6 mt-3">
                  {[
                    ["steps", `${q.steps.length} over ${lastDay}d`],
                    ["enrolled", enrolled],
                    ["replied", replied],
                    ["reply rate", enrolled ? `${Math.round((replied / enrolled) * 100)}%` : "—"],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <div className="n text-[15px]">{v}</div>
                      <div className="text-[10.5px] text-faint">{k}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-[6px] mt-[13px] pt-[13px] border-t border-line2">
                  {q.steps.map((step, i) => (
                    <span key={i} className="flex items-center gap-[5px]">
                      <Pill tone={CHANNEL_PILL[step.channel]}>
                        {step.channel} · 
                        Day {step.delayDays} · {step.title}
                        {isManual(step) ? " · by hand" : ""}
                      </Pill>
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {target && (
        <Confirm
          title={`Delete ${target.name}?`}
          body="This cannot be undone. Anyone still enrolled has to be moved off it first."
          confirmLabel="Delete"
          danger
          onConfirm={() => dispatch({ type: "deleteSequence", id: target.id })}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
