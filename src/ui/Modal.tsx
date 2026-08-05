import { useEffect } from "react";
import { Button } from "./Button";

/**
 * Confirms only. Anything with fields or steps is a page — a form in a dialog
 * cannot be linked to, cannot be reloaded, and hides the list it changes.
 */
export function Confirm({ title, body, confirmLabel, danger, onConfirm, onClose }: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-[rgba(23,24,27,0.34)] flex items-center justify-center z-60 p-6"
      onClick={onClose}
    >
      <div
        className="bg-canvas rounded-xl overflow-hidden w-[440px] max-w-full fadein"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-surface border-b border-line px-5 py-4">
          <div className="text-[15px] font-semibold">{title}</div>
          <p className="text-xs text-muted leading-relaxed mt-[3px]">{body}</p>
        </div>
        <div className="bg-surface px-5 py-[13px] flex justify-end gap-[9px]">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            className={danger ? "bg-danger border-danger hover:bg-[#8c2419]" : undefined}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
