import { useEffect, useRef } from "react";
import type { Contact } from "../../data/types";
import { countWords, cx, fullName, initials, rel } from "../../lib/format";
import { profileUrl } from "../../lib/linkedin";
import { liThreadFor, suggestedReply } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button, LinkButton } from "../../ui/Button";
import { Avatar } from "../../ui/Pill";

/**
 * One stream, the way any chat reads: their messages on the left, ours on the
 * right, and the AI's reply arriving as the next turn rather than in a panel
 * somewhere else. The draft is the last bubble — already written, editable in
 * place, and marked as not sent until the rep says so.
 */
export function ChatThread({ contact }: { contact: Contact }) {
  const { state, dispatch } = useCrm();
  const thread = liThreadFor(state, contact.id);
  const draft = suggestedReply(state, contact);
  const bottom = useRef<HTMLDivElement>(null);

  // A chat sits at the newest message, not the oldest.
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [thread?.msgs.length, draft]);

  const url = profileUrl(contact.linkedin);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      dispatch({ type: "toast", text: "Copied. Paste it into LinkedIn, then mark it sent." });
    } catch {
      dispatch({ type: "toast", text: "Could not reach the clipboard — select the text and copy it by hand." });
    }
  };

  const empty = !thread || thread.msgs.length === 0;
  if (empty && !draft) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-10">
        <div className="text-center max-w-[340px]">
          <div className="text-[13.5px] font-medium">Nothing logged yet</div>
          <p className="text-[12.5px] text-muted leading-relaxed mt-[6px]">
            Paste what they sent you in LinkedIn and a reply gets written for you. Nothing arrives
            here on its own — LinkedIn gives us no API to read.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-[26px] py-5">
      {thread?.msgs.map((m, i) => {
        const inbound = m.dir === "in";
        return (
          <div key={i} className={cx("flex gap-[10px] mb-[14px]", inbound ? "justify-start" : "justify-end")}>
            {inbound && <Avatar size={28}>{initials(contact)}</Avatar>}
            <div className="max-w-[560px] min-w-0">
              <div
                className="flex items-baseline gap-2 mb-[4px]"
                style={{ justifyContent: inbound ? "flex-start" : "flex-end" }}
              >
                <span className="text-[11.5px] font-medium">{inbound ? fullName(contact) : "You"}</span>
                <span className="n text-[10.5px] text-faint">{rel(m.at)}</span>
              </div>
              <div
                className={cx(
                  "text-[13px] leading-[1.7] whitespace-pre-line rounded-[12px] px-[14px] py-[10px] inline-block text-left",
                  inbound ? "bg-surface border border-line" : "bg-greensoft",
                )}
              >
                {m.body}
              </div>
            </div>
            {!inbound && <Avatar size={28} muted>ME</Avatar>}
          </div>
        );
      })}

      {draft && (
        <div className="flex gap-[10px] justify-end">
          <div className="max-w-[560px] min-w-0 w-full">
            <div className="flex items-baseline gap-2 mb-[4px] justify-end">
              <span className="text-[11.5px] font-medium text-green">Drafted for you</span>
              <span className="n text-[10.5px] text-faint">{countWords(draft)} words · not sent</span>
            </div>

            <div className="rounded-[12px] border border-dashed border-green bg-surface p-[10px]">
              <textarea
                className="w-full min-h-[76px] text-[13px] leading-[1.7] bg-transparent border-none resize-y outline-none px-[4px]"
                value={draft}
                onChange={(e) => dispatch({ type: "liRedraft", cid: contact.id, text: e.target.value })}
              />
              <div className="flex items-center gap-2 flex-wrap justify-end pt-[6px]">
                <Button small variant="quiet" onClick={() => dispatch({ type: "liDismissDraft", cid: contact.id })}>
                  Discard
                </Button>
                <Button small onClick={() => dispatch({ type: "liRegenerate", cid: contact.id })}>
                  Another angle
                </Button>
                {url && <LinkButton small href={url}>Open LinkedIn ↗</LinkButton>}
                <Button small onClick={copy}>Copy</Button>
                <Button
                  small
                  variant="primary"
                  onClick={() =>
                    dispatch({ type: "liLogChat", cid: contact.id, messages: [{ dir: "out", body: draft }] })
                  }
                >
                  Mark sent
                </Button>
              </div>
            </div>
          </div>
          <Avatar size={28} muted>AI</Avatar>
        </div>
      )}

      <div ref={bottom} />
    </div>
  );
}
