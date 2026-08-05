import { useEffect, useRef, useState } from "react";
import type { UpworkProfile } from "../../data/types";
import { cx } from "../../lib/format";
import { scoreProfile } from "../../lib/profileScore";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";

const OPENERS = [
  "Rewrite my headline",
  "Rewrite the overview",
  "Are my skills right?",
  "Should I raise my rate?",
];

/**
 * The optimisation chat. Ask it something and the reply arrives with the new
 * text attached, so applying it is one click rather than a copy-paste — the
 * point is to change the profile, not to talk about changing it.
 */
export function ProfileChat({ profile }: { profile: UpworkProfile }) {
  const { state, dispatch } = useCrm();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const turns = state.profileChats[profile.id] ?? [];
  const { passed, total } = scoreProfile(profile);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns.length]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    dispatch({ type: "profileAsk", pid: profile.id, text: q });
    setText("");
  };

  return (
    <div className="w-[420px] shrink-0 border-r border-line bg-surface flex flex-col min-h-0">
      <div className="px-[18px] py-3 border-b border-line2 shrink-0">
        <div className="text-[12.5px] font-medium">Profile assistant</div>
        <div className="text-[11.5px] text-muted mt-[2px]">
          {passed} of {total} checks pass. Ask for a rewrite and apply it here.
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[18px] py-4">
        {turns.length === 0 && (
          <div className="text-[12.5px] text-muted leading-relaxed">
            Ask what is holding this profile back, or pick one below.
          </div>
        )}

        {turns.map((m) => (
          <div key={m.id} className={cx("mb-[14px] flex", m.role === "you" ? "justify-end" : "justify-start")}>
            <div className="max-w-[330px] min-w-0">
              <div
                className={cx(
                  "text-[12.5px] leading-[1.7] whitespace-pre-line rounded-[12px] px-[13px] py-[9px]",
                  m.role === "you" ? "bg-greensoft" : "bg-canvas border border-line",
                )}
              >
                {m.body}
              </div>

              {m.apply && (
                <div className="mt-[7px] border border-dashed border-green rounded-[10px] p-[10px] bg-canvas">
                  <div className="text-[10.5px] text-green uppercase tracking-[0.07em] mb-[5px]">
                    Suggested {m.apply.field}
                  </div>
                  <div className="text-[12px] leading-[1.65] whitespace-pre-line text-ink2 max-h-[150px] overflow-y-auto">
                    {m.apply.value}
                  </div>
                  <div className="flex justify-end mt-[8px]">
                    <Button
                      small
                      variant="primary"
                      onClick={() =>
                        dispatch({
                          type: "profileApply", pid: profile.id,
                          field: m.apply!.field, value: m.apply!.value,
                        })
                      }
                    >
                      Apply to profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      <div className="border-t border-line px-[18px] py-3 shrink-0">
        <div className="flex flex-wrap gap-[5px] mb-[9px]">
          {OPENERS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => ask(o)}
              className="text-[11px] bg-stone text-ink2 rounded-full px-[10px] py-[4px] cursor-pointer hover:bg-line"
            >
              {o}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-surface border border-line rounded-[7px] px-[10px] py-2 text-[12.5px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(text)}
            placeholder="Ask about this profile"
          />
          <Button variant="primary" onClick={() => ask(text)}>
            Ask
          </Button>
        </div>
      </div>
    </div>
  );
}
