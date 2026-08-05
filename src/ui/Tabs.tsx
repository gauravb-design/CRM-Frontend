import { cx } from "../lib/format";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  /** Sits flush under the page header, spanning the full width. */
  className?: string;
}

/**
 * Tabs always span their container rather than sitting over one column, so
 * they read as the state of the screen rather than a filter on part of it.
 */
export function Tabs({ tabs, active, onChange, className }: Props) {
  return (
    <div
      className={cx(
        "bg-surface border-b border-line px-[22px] flex overflow-x-auto shrink-0",
        className,
      )}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cx(
              "px-[14px] pt-3 pb-[10px] text-[12.5px] cursor-pointer flex items-center gap-[7px] whitespace-nowrap border-b-2",
              on ? "border-green text-ink font-medium" : "border-transparent text-muted",
            )}
          >
            <span>{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span
                className={cx(
                  "n text-[11px] rounded-[9px] px-[6px] py-px",
                  on ? "bg-greensoft text-green" : "bg-stone text-faint",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
