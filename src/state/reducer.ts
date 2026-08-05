import { NOW, OWNERS, seedContacts } from "../data/contacts";
import { MAILBOXES, seedDeals, seedSequences, seedTasks } from "../data/pipeline";
import { seedThreads } from "../data/threads";
import type { Contact } from "../data/types";
import { fullName } from "../lib/format";
import { isLinkedInAction, linkedinReducer } from "./linkedinReducer";
import { isSequenceAction, sequenceReducer } from "./sequenceReducer";
import type { Action, CrmState } from "./types";

export const initialState = (): CrmState => ({
  contacts: seedContacts(),
  threads: seedThreads(),
  deals: seedDeals(),
  tasks: seedTasks(),
  notes: [],
  liLog: [],
  sequences: seedSequences(),
  compose: {},
  aiUsed: {},
  openMsgs: {},
  liDrafts: {},
  liSentToday: 12,
  liWeek: 58,
  toast: "",
});

const nextId = (rows: Array<{ id: number }>) => Math.max(0, ...rows.map((r) => r.id)) + 1;

const patchOne = (rows: Contact[], id: number, patch: Partial<Contact>) =>
  rows.map((c) => (c.id === id ? { ...c, ...patch } : c));

/** Drop a thread's draft once it has been sent, so the box comes back empty. */
function clearDraft(s: CrmState, tid: number) {
  const compose = { ...s.compose };
  const aiUsed = { ...s.aiUsed };
  delete compose[tid];
  delete aiUsed[tid];
  return { compose, aiUsed };
}

export function reducer(s: CrmState, a: Action): CrmState {
  if (isSequenceAction(a)) return sequenceReducer(s, a);
  if (isLinkedInAction(a)) return linkedinReducer(s, a);

  switch (a.type) {
    case "toast":
      return { ...s, toast: a.text };
    case "dismissToast":
      return { ...s, toast: "" };

    case "setCompose":
      return { ...s, compose: { ...s.compose, [a.tid]: a.text } };

    case "aiApply":
      return {
        ...s,
        compose: { ...s.compose, [a.tid]: a.text },
        aiUsed: { ...s.aiUsed, [a.tid]: true },
        toast: "Drafted. Read it before it goes.",
      };

    case "toggleMsg":
      return {
        ...s,
        openMsgs: { ...s.openMsgs, [a.key]: !(s.openMsgs[a.key] ?? a.fallback) },
      };

    case "setSubject":
      return {
        ...s,
        threads: s.threads.map((t) => (t.id === a.tid ? { ...t, subject: a.subject } : t)),
      };

    case "send": {
      const thread = s.threads.find((t) => t.id === a.tid);
      if (!thread) return s;
      const contact = s.contacts.find((c) => c.id === thread.cid)!;
      const box = thread.mailbox === null ? null : MAILBOXES[thread.mailbox].address;
      return {
        ...s,
        threads: s.threads.map((t) =>
          t.id === a.tid
            ? { ...t, state: a.next, msgs: [...t.msgs, { dir: "out" as const, at: NOW, body: a.text }] }
            : t,
        ),
        contacts: patchOne(s.contacts, contact.id, {
          status: a.status ?? contact.status,
          lastAt: NOW,
          seqStep: a.advance ? contact.seqStep + 1 : contact.seqStep,
        }),
        ...clearDraft(s, a.tid),
        toast: box
          ? `Sent from ${box} and logged against ${fullName(contact)}.`
          : `Logged against ${fullName(contact)}. Paste it into LinkedIn as well.`,
      };
    }

    case "closeThread": {
      const thread = s.threads.find((t) => t.id === a.tid);
      if (!thread) return s;
      return {
        ...s,
        threads: s.threads.map((t) => (t.id === a.tid ? { ...t, state: "done" as const } : t)),
        contacts: patchOne(s.contacts, thread.cid, { status: a.status, lastAt: NOW }),
        ...clearDraft(s, a.tid),
        toast: a.text,
      };
    }

    case "patchContact":
      return { ...s, contacts: patchOne(s.contacts, a.id, a.patch) };

    case "saveContact": {
      const contacts = patchOne(s.contacts, a.id, a.patch);
      const saved = contacts.find((c) => c.id === a.id);
      return {
        ...s,
        contacts,
        toast: saved ? `${fullName(saved)} updated.` : "",
      };
    }

    case "suppressMany":
      return {
        ...s,
        contacts: s.contacts.map((c) =>
          a.ids.includes(c.id) ? { ...c, status: "Unsubscribed" as const } : c,
        ),
        toast: `${a.ids.length} suppressed. Nothing will send to them again.`,
      };

    case "addContact": {
      const contact = { ...a.contact, id: nextId(s.contacts) };
      return {
        ...s,
        contacts: [...s.contacts, contact],
        toast: `${fullName(contact)} added. Enrol them in a sequence when you are ready.`,
      };
    }

    case "importContacts": {
      let id = Math.max(0, ...s.contacts.map((c) => c.id));
      const added = a.contacts.map((c) => ({ ...c, id: ++id, seqId: a.seqId }));
      const seq = s.sequences.find((q) => q.id === a.seqId);
      return {
        ...s,
        contacts: [...s.contacts, ...added],
        toast: seq
          ? `${added.length} contacts imported onto ${seq.name}.`
          : `${added.length} contacts imported. Enrol them when you are ready.`,
      };
    }

    case "createDeal": {
      const c = s.contacts.find((x) => x.id === a.cid);
      if (!c) return s;
      if (s.deals.some((d) => d.cid === a.cid)) {
        return { ...s, toast: `${c.company} already has a deal on the board.` };
      }
      return {
        ...s,
        deals: [...s.deals, { id: nextId(s.deals), cid: a.cid, value: a.value ?? 30_000, stage: "New", at: NOW }],
        contacts: patchOne(s.contacts, a.cid, { status: "Interested" }),
        toast: `Deal created for ${c.company}. It is in New on the board.`,
      };
    }

    case "moveDeal": {
      const deal = s.deals.find((d) => d.id === a.id);
      const c = deal ? s.contacts.find((x) => x.id === deal.cid) : null;
      return {
        ...s,
        deals: s.deals.map((d) => (d.id === a.id ? { ...d, stage: a.stage, at: NOW } : d)),
        toast: c ? `${c.company} moved to ${a.stage}.` : "",
      };
    }

    case "completeTask": {
      const task = s.tasks.find((t) => t.id === a.id);
      const c = task ? s.contacts.find((x) => x.id === task.cid) : null;
      return {
        ...s,
        tasks: s.tasks.map((t) => (t.id === a.id ? { ...t, done: true, at: NOW } : t)),
        toast: task && c ? `${task.type} logged against ${fullName(c)}.` : "",
      };
    }

    case "addNote":
      return {
        ...s,
        notes: [...s.notes, { id: nextId(s.notes), cid: a.cid, body: a.body, at: NOW, author: "You" }],
        toast: "Logged on the timeline.",
      };

    default:
      return s;
  }
}

/** Shape for a hand-added contact, so the modal does not repeat the defaults. */
export const blankContact = (
  name: string,
  company: string,
  title: string,
  email: string,
  linkedin: string,
): Omit<Contact, "id"> => {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" ") || "—",
    title: title || "Unknown",
    company: company || "Unknown",
    location: "—",
    email,
    linkedin: linkedin || "—",
    hook: "Nothing noted yet — add one before the first email goes out",
    status: "New",
    owner: OWNERS[0],
    source: "Added by hand",
    seqId: 0,
    seqStep: 0,
    createdAt: NOW,
    lastAt: NOW,
    li: "none",
    liAt: null,
    recycleAt: null,
  };
};
