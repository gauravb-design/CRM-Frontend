import { DAY, NOW } from "./contacts";
import type { Proposal, UpworkProfile } from "./types";

/** Connects Upwork charges to submit. Worth showing — they are the real budget. */
export const CONNECTS_PER_PROPOSAL = 16;

export const seedProfiles = (): UpworkProfile[] => [
  {
    id: 1,
    name: "Web app UI/UX",
    headline: "UI/UX designer for SaaS dashboards that people actually finish using",
    rate: 65,
    overview:
      "I redesign the screens where your users give up.\n\nMost dashboards fail in the same three places: onboarding asks for too much before showing value, the empty states say nothing, and the primary action is buried. I fix those first, because they move the numbers fastest.\n\nRecent work: cut a fintech onboarding from 9 steps to 4 and activation went up 31%. Rebuilt a logistics dashboard so the two screens people used all day stopped needing a scroll.\n\nI work in Figma, hand off with a component library your engineers can build from, and stay available through the build rather than disappearing at handoff.",
    skills: ["UI/UX Design", "Figma", "SaaS", "Design Systems", "User Research", "Prototyping", "Web Design"],
    portfolio: 6,
    status: "Live",
    updatedAt: NOW - 12 * DAY,
  },
  {
    id: 2,
    name: "Shopify & ecommerce",
    headline: "Ecommerce designer",
    rate: 55,
    overview:
      "I design Shopify stores. I am passionate about ecommerce and have worked with many clients over the years on a wide range of projects.",
    skills: ["Shopify", "Web Design"],
    portfolio: 1,
    status: "Draft",
    updatedAt: NOW - 40 * DAY,
  },
  {
    id: 3,
    name: "Mobile app design",
    headline: "Product designer for iOS and Android apps, from first sketch to store-ready",
    rate: 70,
    overview:
      "I take apps from an idea to something you can ship.\n\nUsually that means a week of structure work before any pixels — what the app is for, which screen does the work, what gets cut. Then design, prototype, test with five real people, and hand off.\n\nI have shipped fifteen apps, four of which were rebuilds of something that launched and did not work.",
    skills: ["Mobile Design", "iOS", "Android", "Figma", "Prototyping", "User Testing"],
    portfolio: 4,
    status: "Paused",
    updatedAt: NOW - 25 * DAY,
  },
];

export const seedProposals = (): Proposal[] => [
  {
    id: 1,
    cid: 101,
    profileId: 1,
    jobTitle: "Redesign analytics dashboard for B2B SaaS",
    jobUrl: "https://upwork.com/jobs/~01a2b3",
    budget: "$3,000 – $5,000",
    connects: CONNECTS_PER_PROPOSAL,
    body:
      "Your post says the dashboard is “technically fine but nobody uses it”. That usually means the first screen answers a question nobody asked.\n\nI would start by finding the two things your users actually open it for, put those on the landing screen, and move everything else behind a tab. I did exactly that for a logistics platform and daily active use went from 20% of seats to 55% in six weeks.\n\nHappy to walk through their before and after — it is the closest thing I have to your problem.",
    state: "Replied",
    at: NOW - 4 * DAY,
  },
  {
    id: 2,
    cid: 102,
    profileId: 1,
    jobTitle: "Design system for a fintech web app",
    jobUrl: "https://upwork.com/jobs/~04c5d6",
    budget: "$60/hr",
    connects: CONNECTS_PER_PROPOSAL,
    body:
      "You mentioned three engineers building from inconsistent Figma files. The fix is not more files — it is fewer, with tokens your engineers can import.\n\nI would spend the first week auditing what already exists, cut it to a set of components that covers 90% of your screens, and hand it over as a library rather than a document.",
    state: "Sent",
    at: NOW - 2 * DAY,
  },
  {
    id: 3,
    cid: 103,
    profileId: 3,
    jobTitle: "iOS app for a fitness studio chain",
    jobUrl: "https://upwork.com/jobs/~07e8f9",
    budget: "$2,000 – $4,000",
    connects: CONNECTS_PER_PROPOSAL,
    body: "",
    state: "Draft",
    at: NOW - 1 * DAY,
  },
];

/**
 * Clients arrive through a proposal rather than a list, so they start at id 101
 * to keep them clearly apart from the Apollo-sourced contacts.
 */
export const UPWORK_CLIENT_SEED = [
  { id: 101, firstName: "Marcus", lastName: "Feld", company: "Northlane Analytics", title: "Head of Product" },
  { id: 102, firstName: "Dana", lastName: "Okafor", company: "Ledgerly", title: "CTO" },
  { id: 103, firstName: "Priyanka", lastName: "Roy", company: "Studio Ten Fitness", title: "Founder" },
];
