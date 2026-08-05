import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { SequenceStep } from "../../data/types";
import { PageHeader } from "../../layout/PageHeader";
import { ROUTES } from "../../routes";
import { sequenceById } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { Empty } from "../../ui/Feedback";
import { Field, FormPanel, inputCls } from "../../ui/Field";
import { Label } from "../../ui/Pill";
import { StepRow, blankStep } from "./StepRow";

/**
 * The page holds a working copy and commits it in one action on save, so
 * half-typed steps never reach the store and Cancel is genuinely a cancel.
 */
export function SequenceBuilderPage() {
  const { state, dispatch } = useCrm();
  const nav = useNavigate();
  const { id } = useParams();

  const editing = id ? sequenceById(state, Number(id)) : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [steps, setSteps] = useState<SequenceStep[]>(
    editing?.steps ?? [blankStep("LinkedIn", 1), blankStep("Email", 1)],
  );

  const patch = (i: number, p: Partial<SequenceStep>) =>
    setSteps((s) => s.map((step, n) => (n === i ? { ...step, ...p } : step)));

  const move = (i: number, dir: -1 | 1) =>
    setSteps((s) => {
      const next = [...s];
      const [row] = next.splice(i, 1);
      next.splice(i + dir, 0, row);
      return next;
    });

  const lastDay = steps.length ? Math.max(...steps.map((s) => s.delayDays)) : 0;

  const save = () => {
    if (!name.trim()) {
      dispatch({ type: "toast", text: "Give the sequence a name first." });
      return;
    }
    if (!steps.length) {
      dispatch({ type: "toast", text: "A sequence with no steps will never send anything." });
      return;
    }
    dispatch({
      type: "saveSequence",
      id: editing?.id ?? null,
      name: name.trim(),
      note: note.trim(),
      steps,
    });
    nav(ROUTES.sequences);
  };

  const emails = steps.filter((s) => s.channel === "Email").length;

  return (
    <>
      <PageHeader
        title={editing ? `Edit ${editing.name}` : "New sequence"}
        sub={
          steps.length
            ? `${steps.length} steps over ${lastDay} days · ${emails} email, ${steps.length - emails} by hand`
            : "No steps yet"
        }
        actions={
          <>
            <Button onClick={() => nav(ROUTES.sequences)}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              {editing ? "Save changes" : "Create sequence"}
            </Button>
          </>
        }
      />

      <FormPanel width={860}>
        <div className="grid grid-cols-2 gap-3 mb-[18px]">
          <Field label="Name">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="UK & Ireland — SMB"
            />
          </Field>
          <Field label="When to use it">
            <input
              className={inputCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Five touches over nine days. Stops on reply."
            />
          </Field>
        </div>

        <div className="flex items-center gap-2 mb-[10px]">
          <Label>Steps</Label>
          <div className="flex-1" />
          <Button small onClick={() => setSteps((s) => [...s, blankStep("Email", lastDay + 3)])}>
            Add email
          </Button>
          <Button small onClick={() => setSteps((s) => [...s, blankStep("LinkedIn", lastDay + 2)])}>
            Add LinkedIn step
          </Button>
        </div>

        {steps.length === 0 ? (
          <Empty dashed>Add a first step. Most sequences open with a LinkedIn request on day one.</Empty>
        ) : (
          steps.map((step, i) => (
            <StepRow
              key={i}
              step={step}
              index={i}
              isFirst={i === 0}
              isLast={i === steps.length - 1}
              onChange={(p) => patch(i, p)}
              onMove={(dir) => move(i, dir)}
              onRemove={() => setSteps((s) => s.filter((_, n) => n !== i))}
            />
          ))
        )}
      </FormPanel>
    </>
  );
}
