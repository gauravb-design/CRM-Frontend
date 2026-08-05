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

export type Channel = "Email" | "LinkedIn" | "Upwork";

/** Channels with no API, where the record is whatever a person pastes in. */
export const MANUAL_CHANNELS: Channel[] = ["LinkedIn", "Upwork"];

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
  /** Set when the contact arrived through a paid campaign. */
  campaignId?: number;
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

/* ------------------------------------------------------------------ Upwork */

export interface UpworkProfile {
  id: number;
  name: string;
  headline: string;
  /** Hourly rate in USD. */
  rate: number;
  overview: string;
  skills: string[];
  portfolio: number;
  status: "Draft" | "Live" | "Paused";
  updatedAt: number;
}

export type ProposalState = "Draft" | "Sent" | "Replied" | "Interview" | "Hired" | "Declined";

export const PROPOSAL_STATES: ProposalState[] = [
  "Draft", "Sent", "Replied", "Interview", "Hired", "Declined",
];

export interface Proposal {
  id: number;
  /** The client this proposal created. Every proposal has one. */
  cid: number;
  profileId: number;
  jobTitle: string;
  jobUrl: string;
  budget: string;
  connects: number;
  body: string;
  state: ProposalState;
  at: number;
}

/** A turn in the profile-optimisation chat. */
export interface ProfileMessage {
  id: number;
  role: "you" | "ai";
  body: string;
  /** When set, the reply carries text the user can drop straight into a field. */
  apply?: { field: "headline" | "overview" | "skills"; value: string };
}

/* -------------------------------------------------------------- Paid media */

export type AdPlatform = "Google" | "Meta";

/** What the business wants, which is what decides the campaign type. */
export type AdObjective = "Sales" | "Leads" | "Traffic" | "Awareness";

export type CampaignType =
  | "Performance Max"
  | "Search"
  | "Demand Gen"
  | "Advantage+ Shopping"
  | "Lead form"
  | "Traffic"
  | "Awareness";

export type CampaignState = "Draft" | "Learning" | "Active" | "Paused" | "Ended";

export interface AdMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  /** Meta only — average times one person saw it in the last 7 days. */
  frequency?: number;
  /** Days live. Nothing can be judged before the learning period is out. */
  days: number;
}

export interface Campaign {
  id: number;
  platform: AdPlatform;
  type: CampaignType;
  name: string;
  objective: AdObjective;
  dailyBudget: number;
  /** What a conversion is allowed to cost. Drives every budget check. */
  targetCpa: number;
  geo: string;
  audience: string;
  landingUrl: string;
  /** True when a product feed or catalogue is connected. */
  hasFeed: boolean;
  hasTracking: boolean;
  headlines: string[];
  descriptions: string[];
  state: CampaignState;
  startedAt: number | null;
  metrics: AdMetrics;
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
