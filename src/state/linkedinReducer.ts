import { DAY, NOW } from "../data/contacts";
import { LI_DAILY_CAP } from "../data/pipeline";
import type { Contact } from "../data/types";
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

  }
}
