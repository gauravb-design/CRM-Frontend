import { useCrm } from "../../state/store";

/** Only renders once something is ticked, so the table does not reserve space. */
export function BulkBar({ selected, onClear }: { selected: number[]; onClear: () => void }) {
  const { dispatch } = useCrm();
  if (selected.length === 0) return null;

  const actions: Array<[string, () => void]> = [
    ["Enrol in sequence", () =>
      dispatch({ type: "toast", text: `${selected.length} contacts enrolled. The first email goes out tomorrow morning.` })],
    ["Assign owner", () =>
      dispatch({ type: "toast", text: `Owner set on ${selected.length} contacts.` })],
    ["Suppress", () => {
      dispatch({ type: "suppressMany", ids: selected });
      onClear();
    }],
  ];

  return (
    <div className="mx-[22px] mb-[11px] bg-green text-white rounded-[9px] px-[15px] py-[10px] flex items-center gap-[11px] flex-wrap">
      <span className="n text-[12.5px]">{selected.length} selected</span>
      <div className="flex-1" />
      {actions.map(([label, run]) => (
        <button
          key={label}
          type="button"
          onClick={run}
          className="bg-white/15 border border-white/25 text-white rounded-md px-3 py-[6px] text-xs cursor-pointer hover:bg-white/25"
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-white/70 text-xs px-2 py-[6px] cursor-pointer hover:text-white"
      >
        Clear
      </button>
    </div>
  );
}
