import { useState } from "react";
import type { Contact } from "../../data/types";
import { describeParse, parseChat } from "../../lib/chatParse";
import { cx } from "../../lib/format";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";

/**
 * One box, and its only job is getting the conversation in. Type and it is
 * yours; paste and the parser works out who said what. Adding a message from
 * them is what produces the drafted reply above — there is nothing to press.
 */
export function ChatComposer({ contact }: { contact: Contact }) {
  const { dispatch } = useCrm();
  const [text, setText] = useState("");

  const parsed = parseChat(text, contact);

  const add = () => {
    if (parsed.length === 0) {
      dispatch({ type: "toast", text: "Nothing to add — the box is empty." });
      return;
    }
    dispatch({ type: "liLogChat", cid: contact.id, messages: parsed });
    setText("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="border-t border-line bg-surface px-[26px] pt-[13px] pb-[15px] shrink-0">
      <textarea
        className="w-full min-h-[80px] text-[13px] leading-[1.7] bg-surface border border-line rounded-[9px] px-[14px] py-3 resize-y"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder={`Paste what ${contact.firstName} sent, or the whole conversation`}
      />

      <div className="flex items-center gap-2 mt-[9px] flex-wrap">
        {parsed.length > 0 && (
          <span
            className={cx(
              "text-[11.5px] px-[9px] py-[2px] rounded-[5px]",
              parsed.some((m) => m.dir === "in") ? "bg-greensoft text-green" : "bg-stone text-muted",
            )}
          >
            {describeParse(parsed, contact)}
          </span>
        )}
        <span className="text-[11px] text-faint">
          {`Client said "…" reads as ${contact.firstName}. Anything unmarked is you.`}
        </span>

        <div className="flex-1" />
        <Button variant="primary" onClick={add}>
          Add to chat
        </Button>
      </div>
    </div>
  );
}
