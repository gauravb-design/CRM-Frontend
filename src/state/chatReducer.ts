import { NOW } from "../data/contacts";
import type { Channel, Contact, Thread } from "../data/types";
import { generateLi } from "../lib/ai";
import { fullName } from "../lib/format";
import { upworkReply } from "../lib/upworkAi";
import type { Action, CrmState } from "./types";

type ChatAction = Extract<Action, { type: `chat${string}` }>;

export const isChatAction = (a: Action): a is ChatAction => a.type.startsWith("chat");

export const chatKey = (channel: Channel, cid: number) => `${channel}:${cid}`;

/**
 * LinkedIn and Upwork both give us no API, so both are the same interaction:
 * paste what they said, get a reply written for you, copy it back. Only the
 * drafter differs, so only the drafter is branched on.
 */
function autoDraft(channel: Channel, c: Contact, lastInbound: string, angle = 0): string {
  if (channel === "LinkedIn") {
    const intents = ["liAnswer", "liCall", "liObjection"] as const;
    return generateLi(c, intents[angle % 3], "", lastInbound) ?? "";
  }
  if (channel === "Upwork") return upworkReply(c, angle % 3, lastInbound);
  return "";
}

function lastInboundOf(t: Thread | undefined): string {
  if (!t) return "";
  for (let i = t.msgs.length - 1; i >= 0; i--) {
    if (t.msgs[i].dir === "in") return t.msgs[i].body;
  }
  return "";
}

function append(
  s: CrmState,
  c: Contact,
  channel: Channel,
  incoming: Array<{ dir: "in" | "out"; body: string }>,
): Thread[] {
  const existing = s.threads.find((t) => t.channel === channel && t.cid === c.id);
  // A minute apart so a pasted transcript keeps its order on the timeline.
  const msgs = incoming.map((m, i) => ({ ...m, at: NOW + i * 60_000 }));
  const last = incoming[incoming.length - 1];
  const state = last.dir === "in" ? ("needs_reply" as const) : ("awaiting" as const);

  if (!existing) {
    return [
      ...s.threads,
      {
        id: Math.max(0, ...s.threads.map((t) => t.id)) + 1,
        cid: c.id,
        channel,
        state,
        subject: `${channel} — ${fullName(c)}`,
        mailbox: null,
        msgs,
      },
    ];
  }
  return s.threads.map((t) => (t.id === existing.id ? { ...t, state, msgs: [...t.msgs, ...msgs] } : t));
}

export function chatReducer(s: CrmState, a: ChatAction): CrmState {
  const contact = s.contacts.find((c) => c.id === a.cid);
  if (!contact) return s;
  const key = chatKey(a.channel, a.cid);

  switch (a.type) {
    case "chatDraft":
      return { ...s, chatDrafts: { ...s.chatDrafts, [key]: a.text } };

    case "chatDismiss":
      return { ...s, chatDrafts: { ...s.chatDrafts, [key]: "" } };

    case "chatRegenerate": {
      const current = s.chatDrafts[key] ?? "";
      const heard = lastInboundOf(s.threads.find((t) => t.channel === a.channel && t.cid === a.cid));
      const options = [0, 1, 2].map((i) => autoDraft(a.channel, contact, heard, i)).filter(Boolean);
      const next = options.find((o) => o !== current) ?? options[0] ?? "";
      return {
        ...s,
        chatDrafts: { ...s.chatDrafts, [key]: next },
        toast: next ? "Tried a different angle." : "Nothing to draft from yet.",
      };
    }

    case "chatLog": {
      if (a.messages.length === 0) return s;
      const heard = a.messages.some((m) => m.dir === "in");
      const last = a.messages[a.messages.length - 1];

      /* The point of the screen: the moment their message lands, a reply is
       * already written. No button to press. */
      const suggestion = last.dir === "in" ? autoDraft(a.channel, contact, last.body) : "";

      const li = a.channel === "LinkedIn"
        ? { li: heard || contact.li === "conversation" ? ("conversation" as const) : ("messaged" as const), liAt: NOW }
        : {};

      return {
        ...s,
        threads: append(s, contact, a.channel, a.messages),
        contacts: s.contacts.map((c) =>
          c.id === a.cid
            ? {
                ...c, ...li, lastAt: NOW,
                status: heard && (c.status === "New" || c.status === "Contacted") ? "Replied" : c.status,
              }
            : c,
        ),
        // An Upwork reply is the signal the proposal worked.
        proposals: s.proposals.map((p) =>
          a.channel === "Upwork" && p.cid === a.cid && heard && (p.state === "Sent" || p.state === "Draft")
            ? { ...p, state: "Replied" as const }
            : p,
        ),
        liLog:
          a.channel === "LinkedIn"
            ? a.messages.reduce(
                (log, m, i) => [
                  ...log,
                  {
                    id: Math.max(0, ...s.liLog.map((l) => l.id)) + 1 + i,
                    cid: a.cid,
                    text: m.dir === "in" ? "LinkedIn reply received" : "LinkedIn message sent",
                    at: NOW + i * 60_000,
                  },
                ],
                [...s.liLog],
              )
            : s.liLog,
        chatDrafts: { ...s.chatDrafts, [key]: suggestion },
        toast: heard
          ? "Logged. A reply is drafted below — read it before you send it."
          : `Logged against ${fullName(contact)}.`,
      };
    }
  }
}
