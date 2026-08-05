import { useEffect, useRef, useState } from "react";
import { MAILBOXES } from "../../data/pipeline";
import type { Contact, Thread } from "../../data/types";
import { generate, intentsFor } from "../../lib/ai";
import { countWords, cx } from "../../lib/format";
import { draftFor } from "../../state/selectors";
import { useCrm } from "../../state/store";
import { Button } from "../../ui/Button";
import { inputCls } from "../../ui/Field";
import { Label } from "../../ui/Pill";

/**
 * The AI menu lives here rather than in its own component: nesting it would
 * put a Button four levels deep (page → composer → menu → button), and it has
 * no life outside this composer.
 *
 * Intents rather than one generic "write something", because on a cold thread
 * the useful question is always what kind of reply. Shorten and de-hedge
 * transform what is already in the box, so they refuse when it is empty
 * instead of inventing a message.
 */
export function Composer({ thread, contact }: { thread: Thread; contact: Contact }) {
  const { state, dispatch } = useCrm();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const queued = thread.state === "queued";
  const isLi = thread.channel === "LinkedIn";
  const box = thread.mailbox === null ? null : MAILBOXES[thread.mailbox].address;

  const text = draftFor(state, thread.id);
  const words = countWords(text);
  const outOfRange = words > 0 && (words < 20 || words > 120);

  const runIntent = (intent: Parameters<typeof generate>[1]) => {
    setMenuOpen(false);
    const drafted = generate(contact, intent, text);
    if (!drafted) {
      dispatch({ type: "toast", text: "Nothing to work from yet — write a line first and I will tighten it." });
      return;
    }
    dispatch({ type: "aiApply", tid: thread.id, text: drafted });
  };

  const send = () => {
    if (!text.trim()) {
      dispatch({ type: "toast", text: queued ? "Nothing to send — the body is empty." : "Write something first." });
      return;
    }
    dispatch({
      type: "send", tid: thread.id, text, next: "awaiting",
      status: queued ? "Contacted" : "Replied", advance: queued,
    });
  };

  return (
    <div className="border-t border-line bg-surface px-[26px] pt-[13px] pb-[15px] shrink-0">
      <div className="flex items-center gap-[9px] mb-2 flex-wrap">
        <Label>{queued ? "Queued — not sent yet" : "Reply"}</Label>
        <span className="text-[11.5px] text-faint">
          {isLi ? "paste into LinkedIn, then log it here" : `sends from ${box}`}
        </span>
        <div className="flex-1" />
        <span
          className={cx(
            "n text-[11.5px] px-[9px] py-[2px] rounded-[5px]",
            outOfRange ? "bg-ambersoft text-amber" : "bg-stone text-muted",
          )}
        >
          {words} words
        </span>

        <div className="relative" ref={menu}>
          <Button small onClick={() => setMenuOpen((v) => !v)}>
            {queued ? "Draft with AI" : "Reply with AI"}
          </Button>
          {menuOpen && (
            <div className="absolute right-0 bottom-8 w-[268px] bg-surface border border-line rounded-[10px] shadow-[0_10px_28px_rgba(23,24,27,0.14)] z-30 overflow-hidden">
              {intentsFor(thread).map((it, i, arr) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => runIntent(it.id)}
                  className={cx(
                    "w-full text-left px-[13px] py-[10px] cursor-pointer hover:bg-hover",
                    i < arr.length - 1 && "border-b border-line2",
                  )}
                >
                  <div className="text-[12.5px] font-medium">{it.label}</div>
                  <div className="text-[11px] text-muted mt-[2px] leading-snug">{it.note}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {queued && (
        <input
          className={`${inputCls} mb-2 font-medium`}
          value={thread.subject}
          onChange={(e) => dispatch({ type: "setSubject", tid: thread.id, subject: e.target.value })}
          placeholder="Subject"
        />
      )}

      <textarea
        className="w-full min-h-[116px] text-[13px] leading-[1.7] bg-surface border border-line rounded-[9px] px-[14px] py-3 resize-y"
        value={text}
        onChange={(e) => dispatch({ type: "setCompose", tid: thread.id, text: e.target.value })}
        placeholder={isLi ? "What you sent them on LinkedIn" : "Write your reply"}
      />

      {state.aiUsed[thread.id] && (
        <div className="text-[11.5px] text-amber bg-ambersoft rounded-md px-[11px] py-[7px] mt-2 leading-snug">
          Drafted by AI from this thread. Read it before it goes — it has not seen anything you know
          off-platform.
        </div>
      )}

      <div className="flex items-center gap-2 mt-[9px] flex-wrap">
        <Button variant="primary" onClick={send}>
          {queued ? "Send now" : "Send reply"}
        </Button>

        {queued ? (
          <Button onClick={() => dispatch({ type: "toast", text: "Held. Your edits stay on it." })}>
            Hold
          </Button>
        ) : (
          <>
            <Button onClick={() => dispatch({ type: "createDeal", cid: contact.id })}>Interested</Button>
            <Button
              onClick={() =>
                dispatch({
                  type: "closeThread", tid: thread.id, status: "Unqualified",
                  text: "Parked. They come back round in 90 days.",
                })
              }
            >
              Not now
            </Button>
            <Button
              onClick={() =>
                dispatch({
                  type: "closeThread", tid: thread.id, status: "Unsubscribed",
                  text: "Suppressed. Nothing will ever send to them again.",
                })
              }
            >
              Unsubscribe
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
