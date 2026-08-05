import type { Channel, SequenceStep } from "../../data/types";
import { isManual } from "../../data/types";
import { CHANNEL_PILL } from "../../lib/tokens";
import { Button } from "../../ui/Button";
import { Card, Notice } from "../../ui/Feedback";
import { Field, inputCls } from "../../ui/Field";

interface Props {
  step: SequenceStep;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<SequenceStep>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

export function StepRow({ step, index, isFirst, isLast, onChange, onMove, onRemove }: Props) {
  return (
    <Card className="px-4 py-[14px] mb-[9px]">
      <div className="flex items-center gap-[10px] flex-wrap">
        <span className="n w-6 h-6 rounded-full bg-stone text-muted text-[11px] flex items-center justify-center shrink-0">
          {index + 1}
        </span>

        <select
          className="chev border border-line rounded-[7px] px-[9px] py-[6px] text-xs cursor-pointer w-[108px]"
          value={step.channel}
          onChange={(e) => onChange({ channel: e.target.value as Channel })}
        >
          <option value="Email">Email</option>
          <option value="LinkedIn">LinkedIn</option>
        </select>

        <input
          className="flex-1 min-w-[160px] bg-surface border border-line rounded-[7px] px-[10px] py-[6px] text-xs"
          value={step.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="What this step is"
        />

        <div className="flex items-center gap-[6px]">
          <span className="text-[11.5px] text-muted">Day</span>
          <input
            type="number"
            min={1}
            className="n w-[64px] bg-surface border border-line rounded-[7px] px-[8px] py-[6px] text-xs"
            value={step.delayDays}
            onChange={(e) => onChange({ delayDays: Math.max(1, Number(e.target.value) || 1) })}
          />
        </div>

        <Button small onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up">
          ↑
        </Button>
        <Button small onClick={() => onMove(1)} disabled={isLast} aria-label="Move down">
          ↓
        </Button>
        <Button small onClick={onRemove} aria-label="Remove step">
          Remove
        </Button>
      </div>

      <div className="mt-[11px]">
        <Field label={step.channel === "Email" ? "What the email says" : "What the message says"}>
          <textarea
            className={`${inputCls} min-h-[74px] leading-relaxed resize-y`}
            value={step.body}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder="One specific observation, one number, one question."
          />
        </Field>
      </div>

      {isManual(step) && (
        <div className="mt-[9px]">
          <Notice>
            LinkedIn has no API, so this step will appear on the LinkedIn screen as something to do
            by hand and mark off. It never sends itself.
          </Notice>
        </div>
      )}
    </Card>
  );
}

export const blankStep = (channel: Channel, day: number): SequenceStep => ({
  channel,
  title: channel === "Email" ? "Follow up" : "LinkedIn message",
  delayDays: day,
  body: "",
});

/** Steps must read in the order they fire, whatever order they were added. */
export const sortSteps = (steps: SequenceStep[]) =>
  [...steps].sort((a, b) => a.delayDays - b.delayDays);

export const CHANNEL_TONE = CHANNEL_PILL;
