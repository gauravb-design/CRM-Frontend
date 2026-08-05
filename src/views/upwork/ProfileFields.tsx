import type { UpworkProfile } from "../../data/types";
import { cx } from "../../lib/format";
import { checkProfile } from "../../lib/profileScore";
import { useCrm } from "../../state/store";
import { Card } from "../../ui/Feedback";
import { Field, inputCls } from "../../ui/Field";
import { Label } from "../../ui/Pill";

/**
 * Live fields, not a form with a save button — the chat on the left writes
 * into these, so a pending save would put the two out of step.
 */
export function ProfileFields({ profile: p }: { profile: UpworkProfile }) {
  const { dispatch } = useCrm();
  const set = (patch: Partial<UpworkProfile>) =>
    dispatch({ type: "saveProfile", id: p.id, patch });

  const checks = checkProfile(p);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto px-6 py-5">
      <div className="">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Profile name" hint="Internal only — Upwork calls these specialised profiles.">
            <input className={inputCls} value={p.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Hourly rate">
            <input
              type="number"
              className={`${inputCls} n`}
              value={p.rate}
              onChange={(e) => set({ rate: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>

          <Field label="Headline" span hint={`${p.headline.length} characters · 40 to 90 survives truncation`}>
            <input className={inputCls} value={p.headline} onChange={(e) => set({ headline: e.target.value })} />
          </Field>

          <Field label="Overview" span hint={`${p.overview.length} characters`}>
            <textarea
              className={`${inputCls} min-h-[220px] leading-relaxed resize-y`}
              value={p.overview}
              onChange={(e) => set({ overview: e.target.value })}
            />
          </Field>

          <Field label="Skills" span hint="Comma separated. Five to fifteen is the band that works.">
            <input
              className={inputCls}
              value={p.skills.join(", ")}
              onChange={(e) =>
                set({ skills: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })
              }
            />
          </Field>

          <Field label="Portfolio pieces">
            <input
              type="number"
              className={`${inputCls} n`}
              value={p.portfolio}
              onChange={(e) => set({ portfolio: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
          <Field label="Status">
            <select
              className={`${inputCls} chev cursor-pointer`}
              value={p.status}
              onChange={(e) => set({ status: e.target.value as UpworkProfile["status"] })}
            >
              <option value="Draft">Draft</option>
              <option value="Live">Live</option>
              <option value="Paused">Paused</option>
            </select>
          </Field>
        </div>

        <Card className="px-4 py-[14px] mt-5">
          <Label className="mb-[10px]">What Upwork and clients react to</Label>
          {checks.map((c) => (
            <div key={c.id} className="flex gap-[10px] py-[6px] border-b border-line2 last:border-0">
              <span
                className={cx(
                  "w-[16px] h-[16px] rounded-full text-[10px] flex items-center justify-center shrink-0 mt-[1px]",
                  c.ok ? "bg-greensoft text-green" : "bg-ambersoft text-amber",
                )}
              >
                {c.ok ? "✓" : "!"}
              </span>
              <div className="min-w-0">
                <div className={cx("text-[12.5px]", c.ok ? "text-ink2" : "font-medium")}>{c.label}</div>
                {!c.ok && <div className="text-[11.5px] text-muted leading-snug mt-[2px]">{c.hint}</div>}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
