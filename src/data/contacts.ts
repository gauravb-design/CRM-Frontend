import type { Contact, ContactStatus, LiState } from "./types";

export const DAY = 86_400_000;
/** Captured once at load so every relative date in a session agrees. */
export const NOW = Date.now();

export const OWNERS = ["Aarav S.", "Neha K.", "Amit R."];

type Row = [
  first: string,
  last: string,
  title: string,
  company: string,
  location: string,
  status: ContactStatus,
  ownerIdx: number,
  seqId: number,
  seqStep: number,
  daysAgo: number,
  li: LiState,
  liDays: number,
  hook: string,
];

/**
 * Everyone here arrived from Apollo. The hook is the load-bearing column: it is
 * what the opener is written from and what the AI drafts against. A generated
 * email with nothing specific in it reads exactly like every other generated
 * email, so a contact without a hook is not worth sending to.
 */
const ROWS: Row[] = [
  ["Aisha", "Rahman", "Head of Marketing", "Meraki Interiors", "Dubai, AE", "Replied", 0, 1, 2, 0, "accepted", 4,
    "enquiry form asks for eight fields before anyone can ask a question"],
  ["Tom", "Beckett", "Founder", "Beckett Fitness", "Manchester, UK", "Contacted", 0, 1, 2, 1, "requested", 6,
    "class timetable is a PDF, so search cannot read any of it"],
  ["Priya", "Nair", "Marketing Director", "Anantha Retail", "Bengaluru, IN", "New", 1, 1, 0, 3, "none", 0,
    "size guide is an image rather than text"],
  ["Omar", "Al-Farsi", "Managing Director", "Gulf Living Group", "Abu Dhabi, AE", "Replied", 1, 2, 3, 0, "none", 0,
    "listings page takes about nine seconds to load on 4G"],
  ["Sarah", "Whitmore", "Head of Ecommerce", "Whitmore & Co", "London, UK", "Contacted", 0, 1, 1, 2, "requested", 3,
    "checkout makes people create an account before they can pay"],
  ["Daniel", "Okoye", "Founder", "Okoye Legal", "Leeds, UK", "Contacted", 2, 2, 2, 2, "accepted", 5,
    "contact page has a phone number and nothing else"],
  ["Layla", "Haddad", "Marketing Manager", "Cedar Hospitality", "Dubai, AE", "Replied", 2, 2, 2, 1, "conversation", 8,
    "Meta ads point at the homepage rather than a booking page"],
  ["Ravi", "Menon", "Ecommerce Manager", "Menon Textiles", "Sharjah, AE", "Bounced", 1, 1, 1, 4, "none", 0,
    "product photos are all different sizes, so the grid jumps on mobile"],
  ["Grace", "Sullivan", "Founder", "Sullivan Studio", "Dublin, IE", "New", 0, 0, 0, 5, "none", 0,
    "new site has no analytics tag firing"],
  ["Hassan", "Iqbal", "Marketing Director", "Iqbal Motors", "Riyadh, SA", "Interested", 1, 2, 4, 1, "messaged", 9,
    "stock pages have no structured data on them"],
  ["Emma", "Clarke", "Head of Marketing", "Clarke Property", "Bristol, UK", "Interested", 0, 1, 3, 2, "accepted", 7,
    "valuation form runs to six steps"],
  ["Yusuf", "Demir", "Founder", "Demir Automotive", "Istanbul, TR", "Unqualified", 2, 1, 2, 6, "recycled", 30,
    "site stops being usable below about 400px wide"],
  ["Nadia", "Fahmy", "Marketing Manager", "Fahmy Clinics", "Cairo, EG", "Contacted", 1, 2, 1, 3, "requested", 3,
    "booking flow drops people at the calendar step on mobile"],
  ["James", "Whitfield", "Managing Director", "Northgate Legal", "Birmingham, UK", "Unsubscribed", 2, 1, 2, 7, "none", 0,
    "ranking page two for their own service plus the city name"],
  ["Sofia", "Marchetti", "Head of Ecommerce", "Marchetti Foods", "Milan, IT", "New", 0, 0, 0, 4, "none", 0,
    "product pages show no reviews at all"],
];

const slug = (company: string) => company.toLowerCase().replace(/[^a-z]/g, "");

export const seedContacts = (): Contact[] =>
  ROWS.map((r, i) => ({
    id: i + 1,
    firstName: r[0],
    lastName: r[1],
    title: r[2],
    company: r[3],
    location: r[4],
    status: r[5],
    owner: OWNERS[r[6]],
    seqId: r[7],
    seqStep: r[8],
    email: `${r[0].toLowerCase()}@${slug(r[3])}.com`,
    linkedin: `linkedin.com/in/${r[0].toLowerCase()}-${r[1].toLowerCase()}`,
    source: "Apollo",
    hook: r[12],
    createdAt: NOW - (r[9] + 6) * DAY,
    lastAt: NOW - r[9] * DAY,
    li: r[10],
    liAt: r[10] === "none" ? null : NOW - r[11] * DAY,
    recycleAt: r[10] === "recycled" ? NOW + 60 * DAY : null,
  }));
