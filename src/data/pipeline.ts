import { DAY, NOW } from "./contacts";
import type { Deal, DealStage, Mailbox, Sequence, Task } from "./types";

export const STAGES: DealStage[] = [
  "New",
  "Meeting booked",
  "Proposal sent",
  "Negotiation",
  "Won",
  "Lost",
];

/** Four sending domains, none of them the company's real one. A bounce on a
 *  cold-sending domain must never touch the address clients reply to. */
export const MAILBOXES: Mailbox[] = [
  { address: "aarav@uiuxstudio-team.com", sentToday: 31, cap: 40 },
  { address: "neha@uiuxstudio-hq.com", sentToday: 36, cap: 40 },
  { address: "amit@uiux-partners.com", sentToday: 28, cap: 40 },
  { address: "hello@uiux-collective.com", sentToday: 19, cap: 40 },
];

/** LinkedIn's limits, not ours. Past these an account gets restricted. */
export const LI_DAILY_CAP = 20;
export const LI_WEEKLY_CAP = 100;

export const seedDeals = (): Deal[] => [
  { id: 1, cid: 10, value: 42_000, stage: "Meeting booked", at: NOW - 3 * DAY },
  { id: 2, cid: 11, value: 28_000, stage: "Proposal sent", at: NOW - 9 * DAY },
  { id: 3, cid: 1, value: 36_000, stage: "New", at: NOW - 1 * DAY },
];

export const seedTasks = (): Task[] => [
  { id: 1, cid: 3, type: "LinkedIn connect", at: NOW - 3 * DAY },
  { id: 2, cid: 13, type: "LinkedIn message", at: NOW - 2 * DAY },
  { id: 3, cid: 9, type: "LinkedIn connect", at: NOW },
  { id: 4, cid: 15, type: "LinkedIn connect", at: NOW },
  { id: 5, cid: 10, type: "Call", at: NOW },
  { id: 6, cid: 5, type: "Follow up", at: NOW + 2 * DAY },
  { id: 7, cid: 6, type: "LinkedIn message", at: NOW + 3 * DAY },
];

export const seedSequences = (): Sequence[] => [
  {
    id: 1,
    name: "UK & Ireland — SMB",
    note: "Five touches over nine days, two of them on LinkedIn. Stops the moment someone replies.",
    active: true,
    steps: [
      { channel: "LinkedIn", title: "Connection request", delayDays: 1,
        body: "No note, no pitch. A request with a note gets accepted less often." },
      { channel: "Email", title: "Opener", delayDays: 1,
        body: "One specific thing you noticed on their site, one number, one question. Sixty to eighty words." },
      { channel: "LinkedIn", title: "Message", delayDays: 3,
        body: "Only if they accepted. Same observation, shorter." },
      { channel: "Email", title: "New angle", delayDays: 4,
        body: "A different problem to the opener, plus one case study with a real number in it." },
      { channel: "Email", title: "Close out", delayDays: 9,
        body: "Short. Give them permission to say no — it is what gets the reply." },
    ],
  },
  {
    id: 2,
    name: "Gulf — mid-market",
    note: "Slower cadence for a Sunday to Thursday working week. Nothing sends on a Friday.",
    active: true,
    steps: [
      { channel: "Email", title: "Opener", delayDays: 1,
        body: "Same shape as the UK opener, but the case study is a regional one." },
      { channel: "LinkedIn", title: "Connection request", delayDays: 2,
        body: "After the email rather than before, so the name is already familiar." },
      { channel: "Email", title: "New angle", delayDays: 5,
        body: "Lead with the number. Cost per lead is the one that gets replies here." },
      { channel: "LinkedIn", title: "Message", delayDays: 7,
        body: "Only if accepted." },
      { channel: "Email", title: "Close out", delayDays: 12,
        body: "Permission to say no, and an offer to come back next quarter." },
    ],
  },
];
