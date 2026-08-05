export type ContactStatus =
  | "New"
  | "Contacted"
  | "Replied"
  | "Interested"
  | "Unqualified"
  | "Unsubscribed"
  | "Bounced";

/**
 * Where a contact has got to on LinkedIn. Every one of these transitions is
 * made by a person clicking a button, because LinkedIn gives us no API — the
 * record is only ever as true as the rep marking it off.
 */
export type LiState =
  | "none"
  | "requested"
  | "accepted"
  | "messaged"
  | "conversation"
  | "recycled";

export type Channel = "Email" | "LinkedIn";

/** Which pile a conversation sits in. Drives the inbox tabs. */
export type ThreadState = "needs_reply" | "awaiting" | "queued" | "done" | "bounced";

export type DealStage =
  | "New"
  | "Meeting booked"
  | "Proposal sent"
  | "Negotiation"
  | "Won"
  | "Lost";

export type TaskType = "LinkedIn connect" | "LinkedIn message" | "Follow up" | "Call";

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  location: string;
  email: string;
  linkedin: string;
  /** The one concrete observation every opener is built on. */
  hook: string;
  status: ContactStatus;
  owner: string;
  source: string;
  seqId: number;
  seqStep: number;
  createdAt: number;
  lastAt: number;
  li: LiState;
  liAt: number | null;
  recycleAt: number | null;
}

export interface Message {
  dir: "in" | "out";
  at: number;
  body: string;
}

export interface Thread {
  id: number;
  cid: number;
  channel: Channel;
  state: ThreadState;
  subject: string;
  /** Index into MAILBOXES. Null for LinkedIn, which has no mailbox. */
  mailbox: number | null;
  msgs: Message[];
}

export interface Deal {
  id: number;
  cid: number;
  value: number;
  stage: DealStage;
  /** When it entered the current stage, so the board can show staleness. */
  at: number;
}

export interface Task {
  id: number;
  cid: number;
  type: TaskType;
  at: number;
  done?: boolean;
}

export interface SequenceStep {
  channel: Channel;
  title: string;
  /** Day the step fires, counted from enrolment. */
  delayDays: number;
  body: string;
}

/** LinkedIn has no API, so a LinkedIn step is always one a person does by
 *  hand. Deriving it beats storing a flag that can disagree with the channel. */
export const isManual = (step: SequenceStep) => step.channel === "LinkedIn";

export interface Sequence {
  id: number;
  name: string;
  note: string;
  active: boolean;
  steps: SequenceStep[];
}

export interface Note {
  id: number;
  cid: number;
  body: string;
  at: number;
  author: string;
}

export interface LiLogEntry {
  id: number;
  cid: number;
  text: string;
  at: number;
}

export interface Mailbox {
  address: string;
  sentToday: number;
  cap: number;
}

/** One row on a contact's activity timeline, assembled from everything else. */
export interface TimelineEntry {
  key: string;
  kind: "email" | "linkedin" | "note" | "task" | "deal";
  at: number;
  title: string;
  meta: string;
  body: string;
}
