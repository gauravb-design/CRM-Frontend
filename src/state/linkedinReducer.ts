import { DAY, NOW } from "../data/contacts";
import { LI_DAILY_CAP } from "../data/pipeline";
import type { Contact, Thread } from "../data/types";
import { generateLi, type LiIntent } from "../lib/ai";
import { fullName, shortDate } from "../lib/format";
import type { Action, CrmState } from "./types";

type LiAction = Extract<Action, { type: `li${string}` }>;

export const isLinkedInAction = (a: Action): a is LiAction => a.type.startsWith("li");

const patchOne = (rows: Contact[], id: number, patch: Partial<Contact>) =>
  rows.map((c) => (c.id === id ? { ...c, ...patch } : c));

const logTouch = (s: CrmState, cid: number, text: string) => [
  ...s.liLog,
  { id: Math.max(0, ...s.liLog.map((l) => l.id)) + 1, cid, text, at: NOW },
];

/**
 * A LinkedIn conversation is an ordinary thread with channel "LinkedIn" and no
 * mailbox, so it shows up in the unified inbox alongside email without any
 * special casing. The first logged message creates it.
 */
function appendToConversation(
  s: CrmState,
  c: Contact,
  incoming: Array<{ dir: "in" | "out"; body: string }>,
): Thread[] {
  const existing = s.threads.find((t) => t.channel === "LinkedIn" && t.cid === c.id);
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
        channel: "LinkedIn",
        state,
        subject: `LinkedIn — ${fullName(c)}`,
        mailbox: null,
        msgs,
      },
    ];
  }
  return s.threads.map((t) =>
    t.id === existing.id ? { ...t, state, msgs: [...t.msgs, ...msgs] } : t,
  );
}

/** The last thing they said, which is what any draft answers. */
function lastInbound(s: CrmState, cid: number): string {
  const t = s.threads.find((x) => x.channel === "LinkedIn" && x.cid === cid);
  if (!t) return "";
  for (let i = t.msgs.length - 1; i >= 0; i--) {
    if (t.msgs[i].dir === "in") return t.msgs[i].body;
  }
  return "";
}

/**
 * Rotating the angle rather than re-rolling the same one, so pressing it twice
 * gives something genuinely different instead of the same sentence again.
 */
const ANGLES: LiIntent[] = ["liAnswer", "liCall", "liObjection"];

export function linkedinReducer(s: CrmState, a: LiAction): CrmState {
  const contact = "cid" in a ? s.contacts.find((c) => c.id === a.cid) : undefined;
  if (!contact) return s;

  switch (a.type) {
    /* The daily cap is the point of this screen, so it refuses rather than
     * warns. Twenty is the number that keeps an account unrestricted. */
    case "liSend": {
      if (s.liSentToday >= LI_DAILY_CAP) {
        return { ...s, toast: "You are at 20 for today. The rest of the queue keeps until tomorrow." };
      }
      return {
        ...s,
        contacts: patchOne(s.contacts, a.cid, { li: "requested", liAt: NOW, lastAt: NOW }),
        liLog: logTouch(s, a.cid, "Connection request sent"),
        liSentToday: s.liSentToday + 1,
        liWeek: s.liWeek + 1,
        toast: `Logged against ${fullName(contact)}. ${LI_DAILY_CAP - s.liSentToday - 1} left today.`,
      };
    }

    case "liSet":
      return {
        ...s,
        contacts: patchOne(s.contacts, a.cid, { li: a.li, liAt: NOW, lastAt: NOW }),
        liLog: logTouch(s, a.cid, a.note),
        toast: `${a.note} — ${fullName(contact)}.`,
      };

    case "liRecycle": {
      const back = NOW + 90 * DAY;
      return {
        ...s,
        contacts: patchOne(s.contacts, a.cid, {
          li: "recycled", liAt: NOW, recycleAt: back, status: "Unqualified",
        }),
        liLog: logTouch(s, a.cid, "Recycled for 90 days"),
        toast: `${fullName(contact)} parked. Back in the queue on ${shortDate(back)}.`,
      };
    }

    case "liRestore":
      return {
        ...s,
        contacts: patchOne(s.contacts, a.cid, {
          li: "none", liAt: null, recycleAt: null, status: "New",
        }),
        liLog: logTouch(s, a.cid, "Brought back from recycling"),
        toast: `${fullName(contact)} is back in the to-send queue.`,
      };

    case "liRedraft":
      return {
        ...s,
        liDrafts: { ...s.liDrafts, [a.cid]: a.text },
        toast: "Redrafted. Copy it across when you are happy with it.",
      };

    /* One box in the UI, so one action here. There is no LinkedIn API and no
     * webhook — pasting is the only way a conversation ever reaches the
     * record, and the parser has already worked out the directions. */
    case "liLogChat": {
      if (a.messages.length === 0) return s;
      const heard = a.messages.some((m) => m.dir === "in");

      /* The point of the screen: the moment their message lands, a reply is
       * already written. No button to press — that was the whole ask. */
      const last = a.messages[a.messages.length - 1];
      const suggestion =
        last.dir === "in" ? (generateLi(contact, "liAnswer", "", last.body) ?? "") : "";

      return {
        ...s,
        threads: appendToConversation(s, contact, a.messages),
        contacts: patchOne(s.contacts, a.cid, {
          li: heard ? "conversation" : contact.li === "conversation" ? "conversation" : "messaged",
          liAt: NOW,
          lastAt: NOW,
          status:
            heard && (contact.status === "New" || contact.status === "Contacted")
              ? "Replied"
              : contact.status,
        }),
        liLog: a.messages.reduce(
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
        ),
        liDrafts: { ...s.liDrafts, [a.cid]: suggestion },
        toast: heard
          ? `Logged. A reply is drafted below — read it before you send it.`
          : `Logged against ${fullName(contact)}.`,
      };
    }

    case "liRegenerate": {
      const current = s.liDrafts[a.cid] ?? "";
      const heard = lastInbound(s, a.cid);
      const options = ANGLES.map((i) => generateLi(contact, i, "", heard) ?? "").filter(Boolean);
      const next = options.find((o) => o !== current) ?? options[0] ?? "";
      return {
        ...s,
        liDrafts: { ...s.liDrafts, [a.cid]: next },
        toast: next ? "Tried a different angle." : "Nothing to draft from yet.",
      };
    }

    case "liDismissDraft":
      return { ...s, liDrafts: { ...s.liDrafts, [a.cid]: "" } };
  }
}
