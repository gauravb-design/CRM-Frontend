import type { TimelineEntry } from "../../data/types";
import { cx, fullDate } from "../../lib/format";
import { TIMELINE_ICON } from "../../lib/tokens";
import { Card, Empty } from "../../ui/Feedback";

export function ContactTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <Empty>Nothing logged under this tab yet.</Empty>;

  return (
    <>
      {entries.map((e, i) => {
        const icon = TIMELINE_ICON[e.kind];
        return (
          <div key={e.key} className="flex gap-3 mb-4">
            <div className="flex flex-col items-center shrink-0">
              <span
                className={cx(
                  "w-[26px] h-[26px] rounded-[7px] text-[11px] font-semibold flex items-center justify-center shrink-0",
                  icon.cls,
                )}
              >
                {icon.glyph}
              </span>
              {/* The rail stops at the last entry rather than trailing off. */}
              <div
                className={cx("w-px flex-1 mt-1", i === entries.length - 1 ? "bg-transparent" : "bg-line")}
              />
            </div>

            <div className="min-w-0 flex-1 pb-[2px]">
              <div className="flex items-baseline gap-[9px] flex-wrap">
                <span className="text-[12.5px] font-medium">{e.title}</span>
                <span className="n text-[11px] text-faint">{fullDate(e.at)}</span>
              </div>
              {e.meta && <div className="text-[11.5px] text-muted mt-[2px]">{e.meta}</div>}
              {e.body && (
                <Card className="px-[13px] py-[11px] mt-2 text-[12.5px] leading-[1.7] whitespace-pre-line text-ink">
                  {e.body}
                </Card>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
