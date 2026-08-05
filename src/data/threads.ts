import { DAY, NOW } from "./contacts";
import type { Thread } from "./types";

/** Days back, optionally offset by hours, so seeded threads read in order. */
const at = (days: number, hours = 0) => NOW - days * DAY + hours * 3_600_000;

/**
 * Threads own the messages. Nothing about a conversation lives anywhere else,
 * which is what lets a reply land on the right record without anyone filing
 * it: the inbound message carries In-Reply-To pointing at the Message-ID we
 * kept when we sent, and that header match is the whole of "logs itself".
 */
export const seedThreads = (): Thread[] => [
  {
    id: 1, cid: 1, channel: "Email", state: "needs_reply", mailbox: 0,
    subject: "Meraki Interiors — the enquiry form",
    msgs: [
      { dir: "out", at: at(6), body: "Hi Aisha,\n\nYour enquiry form asks for eight fields before someone can ask a question. On a phone that is a lot of thumbs.\n\nWe rebuilt the same thing for a fit-out firm in Dubai and enquiries went up 40% without touching ad spend.\n\nWorth a look at yours?" },
      { dir: "out", at: at(2), body: "Following up with something concrete.\n\nHere is the before and after of that form, if it is useful. Two fields, one screen.\n\nHappy to walk you through what we changed." },
      { dir: "in", at: at(0, -2), body: "This is timely — we are redoing the site in September anyway. What would something like this cost, roughly?" },
    ],
  },
  {
    id: 2, cid: 4, channel: "Email", state: "needs_reply", mailbox: 1,
    subject: "Gulf Living — page speed on mobile",
    msgs: [
      { dir: "out", at: at(9), body: "Hi Omar,\n\nYour listings page takes about nine seconds to load on 4G. Most people are gone by four.\n\nWe fixed this for another property group here and their cost per lead dropped 38%.\n\nWorth fifteen minutes?" },
      { dir: "in", at: at(0, -4), body: "Not right now, we are mid-quarter. Try me in October." },
    ],
  },
  {
    id: 3, cid: 7, channel: "LinkedIn", state: "needs_reply", mailbox: null,
    subject: "LinkedIn — Layla Haddad",
    msgs: [
      { dir: "out", at: at(5), body: "Connection request sent." },
      { dir: "out", at: at(3), body: "Thanks for connecting, Layla. Noticed Cedar is running Meta ads to the homepage rather than a booking page — usually worth a test." },
      { dir: "in", at: at(1), body: "Interesting, that is fair. What would you send them to instead?" },
    ],
  },
  {
    id: 4, cid: 2, channel: "Email", state: "awaiting", mailbox: 0,
    subject: "Beckett Fitness — one thing I noticed",
    msgs: [
      { dir: "out", at: at(4), body: "Hi Tom,\n\nYour class timetable is a PDF. Google cannot read it, so none of those classes show up in search.\n\nWe moved a gym chain off PDFs and their organic bookings doubled in a quarter.\n\nWorth a look?" },
    ],
  },
  {
    id: 5, cid: 5, channel: "Email", state: "awaiting", mailbox: 2,
    subject: "Whitmore & Co — checkout drop-off",
    msgs: [
      { dir: "out", at: at(2), body: "Hi Sarah,\n\nYour checkout asks people to create an account before paying. That single step usually costs 20 to 30% of carts.\n\nWe removed it for a retailer your size and revenue per session went up 18%.\n\nWorth a quick look?" },
    ],
  },
  {
    id: 6, cid: 13, channel: "LinkedIn", state: "awaiting", mailbox: null,
    subject: "LinkedIn — Nadia Fahmy",
    msgs: [{ dir: "out", at: at(3), body: "Connection request sent." }],
  },
  {
    id: 7, cid: 3, channel: "Email", state: "queued", mailbox: 1,
    subject: "Anantha Retail — one thing I noticed",
    msgs: [],
  },
  {
    id: 8, cid: 6, channel: "Email", state: "queued", mailbox: 2,
    subject: "Re: Okoye Legal — the contact page",
    msgs: [
      { dir: "out", at: at(5), body: "Hi Daniel,\n\nYour contact page has a phone number and nothing else. Half of the people who land there at 9pm will not call.\n\nWe added a two-field form for a firm your size and enquiries went up by a third.\n\nWorth a look?" },
    ],
  },
  {
    id: 9, cid: 8, channel: "Email", state: "bounced", mailbox: 1,
    subject: "Menon Textiles — product photos",
    msgs: [
      { dir: "out", at: at(4), body: "Hi Ravi,\n\nNoticed the product photos are all different sizes, which makes the grid jump around on mobile.\n\nWorth a quick look?" },
    ],
  },
  {
    id: 10, cid: 11, channel: "Email", state: "done", mailbox: 0,
    subject: "Clarke Property — the enquiry form",
    msgs: [
      { dir: "out", at: at(8), body: "Hi Emma,\n\nYour valuation form is six steps. Most of that could be two.\n\nWorth a look?" },
      { dir: "in", at: at(3), body: "Yes, this is something we have been meaning to fix. Can you send some times?" },
      { dir: "out", at: at(3, 2), body: "Great. Does Tuesday 11am or Wednesday 2pm work? Half an hour is plenty." },
    ],
  },
];
