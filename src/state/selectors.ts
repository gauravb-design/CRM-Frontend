import { MAILBOXES } from "../data/pipeline";
import type {
  Channel, Contact, ContactStatus, LiState, Sequence, ThreadState, TimelineEntry,
} from "../data/types";
import { compose, liVariants } from "../lib/ai";
import { fullName, money } from "../lib/format";
import type { CrmState } from "./types";

export const contactById = (s: CrmState, id: number) => s.contacts.find((c) => c.id === id) ?? null;
export const sequenceById = (s: CrmState, id: number): Sequence | null =>
  s.sequences.find((q) => q.id === id) ?? null;
export const dealFor = (s: CrmState, cid: number) => s.deals.find((d) => d.cid === cid) ?? null;
export const threadById = (s: CrmState, id: number) => s.threads.find((t) => t.id === id) ?? null;
export const openTasksFor = (s: CrmState, cid: number) =>
  s.tasks.filter((t) => t.cid === cid && !t.done);

/**
 * Composer text for a thread, read fresh every time. A queued email nobody has
 * touched shows the seeded opener; anything else starts empty.
 */
export function draftFor(s: CrmState, tid: number): string {
  const stored = s.compose[tid];
  if (stored !== undefined) return stored;
  const t = threadById(s, tid);
  if (!t || t.state !== "queued") return "";
  const c = contactById(s, t.cid);
  return c ? compose(c, "opener") : "";
}

export const INBOX_TABS: Array<{ id: ThreadState; label: string }> = [
  { id: "needs_reply", label: "Needs reply" },
  { id: "awaiting", label: "Awaiting" },
  { id: "queued", label: "Queued" },
  { id: "done", label: "Sent" },
  { id: "bounced", label: "Bounced" },
];

export function threadsFor(s: CrmState, tab: ThreadState, channel: "all" | Channel, search: string) {
  const q = search.trim().toLowerCase();
  return s.threads.filter((t) => {
    if (t.state !== tab) return false;
    if (channel !== "all" && t.channel !== channel) return false;
    if (!q) return true;
    const c = contactById(s, t.cid);
    return c ? `${t.subject} ${fullName(c)} ${c.company}`.toLowerCase().includes(q) : false;
  });
}

export const countThreads = (s: CrmState, tab: ThreadState, channel: "all" | Channel) =>
  s.threads.filter((t) => t.state === tab && (channel === "all" || t.channel === channel)).length;

const CLOSED: ContactStatus[] = ["Unqualified", "Unsubscribed", "Bounced"];

export const CONTACT_TABS: Array<{ id: string; label: string; match: (c: Contact) => boolean }> = [
  { id: "all", label: "All", match: () => true },
  { id: "new", label: "Not contacted", match: (c) => c.status === "New" },
  { id: "sequence", label: "In sequence", match: (c) => c.status === "Contacted" },
  { id: "replied", label: "Replied", match: (c) => c.status === "Replied" },
  { id: "interested", label: "Interested", match: (c) => c.status === "Interested" },
  { id: "out", label: "Closed out", match: (c) => CLOSED.includes(c.status) },
];

/** One pass, three conditions. Not three chained filters. */
export function filteredContacts(s: CrmState, tab: string, owner: string, search: string) {
  const match = CONTACT_TABS.find((t) => t.id === tab)?.match ?? (() => true);
  const q = search.trim().toLowerCase();
  return s.contacts.filter(
    (c) =>
      match(c) &&
      (owner === "all" || c.owner === owner) &&
      (!q || `${fullName(c)} ${c.company} ${c.email}`.toLowerCase().includes(q)),
  );
}

const LI_AWAITING: LiState[] = ["requested", "messaged"];

export const LI_TABS: Array<{ id: string; label: string; match: (c: Contact) => boolean }> = [
  {
    id: "to_send",
    label: "To send",
    match: (c) => c.li === "none" && c.status !== "Unsubscribed" && c.status !== "Bounced",
  },
  { id: "awaiting", label: "Awaiting", match: (c) => LI_AWAITING.includes(c.li) },
  { id: "to_message", label: "To message", match: (c) => c.li === "accepted" },
  { id: "conversation", label: "In conversation", match: (c) => c.li === "conversation" },
  { id: "recycled", label: "Recycled", match: (c) => c.li === "recycled" },
];

/** The conversation list down the left of the LinkedIn screen. */
export function liConversations(s: CrmState, tab: string, search: string) {
  const match = LI_TABS.find((t) => t.id === tab)?.match ?? (() => false);
  const q = search.trim().toLowerCase();
  return s.contacts.filter(
    (c) => match(c) && (!q || `${fullName(c)} ${c.company}`.toLowerCase().includes(q)),
  );
}

/** A contact has at most one LinkedIn conversation. */
export const liThreadFor = (s: CrmState, cid: number) =>
  s.threads.find((t) => t.channel === "LinkedIn" && t.cid === cid) ?? null;

/**
 * The reply waiting to be sent. Written by the AI the moment their message was
 * logged, then editable. Empty means there is nothing pending — either they
 * have not written, or the draft was sent or dismissed.
 */
export function suggestedReply(s: CrmState, c: Contact): string {
  const stored = s.liDrafts[c.id];
  if (stored !== undefined) return stored;
  const started = s.threads.some((t) => t.channel === "LinkedIn" && t.cid === c.id && t.msgs.length);
  return !started && c.li === "accepted" ? liVariants(c)[0] : "";
}

/** What they said last, which is what the AI drafts a reply to. */
export function lastInboundFrom(s: CrmState, cid: number): string {
  const t = liThreadFor(s, cid);
  if (!t) return "";
  for (let i = t.msgs.length - 1; i >= 0; i--) {
    if (t.msgs[i].dir === "in") return t.msgs[i].body;
  }
  return "";
}

/** People who accepted or wrote back — the ones actually waiting on us. */
export const liWaiting = (s: CrmState) =>
  s.contacts.filter((c) => c.li === "accepted" || c.li === "conversation").length;

const TAB_KIND: Record<string, TimelineEntry["kind"] | null> = {
  activity: null,
  emails: "email",
  linkedin: "linkedin",
  notes: "note",
};

/**
 * Everything that has happened to a contact, newest first, assembled from the
 * threads, notes, tasks and deals rather than stored twice. A timeline that
 * can drift from the conversation it describes is worse than no timeline.
 *
 * The tab filter is applied while collecting, so this is one build and one
 * sort rather than a chain of passes.
 */
export function timelineFor(s: CrmState, cid: number, tab: string): TimelineEntry[] {
  const want = TAB_KIND[tab] ?? null;
  const out: TimelineEntry[] = [];
  const owner = contactById(s, cid)?.owner ?? "the owner";

  if (!want || want === "email" || want === "linkedin") {
    for (const t of s.threads) {
      if (t.cid !== cid) continue;
      const kind = t.channel === "LinkedIn" ? "linkedin" : "email";
      if (want && kind !== want) continue;
      const box = t.mailbox === null ? null : MAILBOXES[t.mailbox].address;
      t.msgs.forEach((m, i) => {
        const inbound = m.dir === "in";
        out.push({
          key: `m${t.id}-${i}`,
          kind,
          at: m.at,
          body: m.body,
          title:
            kind === "linkedin"
              ? inbound ? "LinkedIn reply received" : "LinkedIn touch logged"
              : inbound ? "Email reply received" : "Email sent",
          meta:
            kind === "linkedin"
              ? inbound ? `logged by ${owner}` : "logged by hand"
              : inbound ? `to ${box} · matched to this thread` : `from ${box} · logged automatically`,
        });
      });
    }
  }

  if (!want || want === "linkedin") {
    for (const l of s.liLog) {
      if (l.cid === cid) {
        out.push({ key: `l${l.id}`, kind: "linkedin", at: l.at, title: l.text, meta: "logged by hand", body: "" });
      }
    }
  }
  if (!want || want === "note") {
    for (const n of s.notes) {
      if (n.cid === cid) {
        out.push({ key: `n${n.id}`, kind: "note", at: n.at, title: "Note", meta: `by ${n.author}`, body: n.body });
      }
    }
  }
  if (!want) {
    for (const t of s.tasks) {
      if (t.cid === cid && t.done) {
        out.push({ key: `k${t.id}`, kind: "task", at: t.at, title: `${t.type} completed`, meta: "", body: "" });
      }
    }
    for (const d of s.deals) {
      if (d.cid === cid) {
        out.push({
          key: `d${d.id}`, kind: "deal", at: d.at,
          title: `Deal created — ${money(d.value)}`, meta: `Stage: ${d.stage}`, body: "",
        });
      }
    }
  }

  return out.sort((a, b) => b.at - a.at);
}
