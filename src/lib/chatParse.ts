import type { Contact } from "../data/types";

export interface ParsedMessage {
  dir: "in" | "out";
  body: string;
}

/** Lines LinkedIn puts between messages that carry nothing. */
const NOISE = /^\s*(\d{1,2}:\d{2}\s*(am|pm)?|today|yesterday|(mon|tues?|wed(nes)?|thur?s?|fri|sat(ur)?|sun)(day)?)\s*$/i;

const strip = (s: string) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

/** `Client said "x"` and `You said "x"`, with or without the quotes. */
const SAID_THEM = /^\s*(?:client|they|them|he|she)\s+said\s*[:\-]?\s*"?(.*?)"?\s*$/i;
const SAID_YOU = /^\s*(?:you|we|i|me)\s+said\s*[:\-]?\s*"?(.*?)"?\s*$/i;

/** `Them: x` / `You: x`, and LinkedIn's own `Aisha Rahman: x`. */
const LABEL_THEM = /^\s*(?:client|they|them)\s*[:\-]\s*(.*)$/i;
const LABEL_YOU = /^\s*(?:you|we|me|us)\s*[:\-]\s*(.*)$/i;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Work out who said what in a pasted LinkedIn conversation.
 *
 * The rule that makes one box work: **an unmarked paste is yours.** You are
 * typing into a chat, so the default is that you wrote it. Their messages have
 * to announce themselves — `Client said "…"`, `Aisha:`, or LinkedIn's own
 * transcript shape where the sender's name sits on its own line.
 *
 * Getting this backwards would quietly file your own words as the client's, so
 * the composer shows what the parse decided before anything is committed.
 */
export function parseChat(raw: string, contact: Contact): ParsedMessage[] {
  const text = strip(raw).trim();
  if (!text) return [];

  const first = esc(contact.firstName);
  const full = esc(`${contact.firstName} ${contact.lastName}`);
  const namedLabel = new RegExp(`^\\s*(?:${full}|${first})\\s*[:\\-]\\s*(.*)$`, "i");
  const bareName = new RegExp(`^\\s*(?:${full}|${first})\\s*$`, "i");
  const bareYou = /^\s*(?:you|me)\s*$/i;

  const out: ParsedMessage[] = [];
  let dir: "in" | "out" | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join("\n").trim();
    if (body) out.push({ dir: dir ?? "out", body });
    buffer = [];
  };

  for (const line of text.split("\n")) {
    if (NOISE.test(line)) continue;

    const openers: Array<[RegExp, "in" | "out"]> = [
      [SAID_THEM, "in"], [SAID_YOU, "out"],
      [LABEL_THEM, "in"], [LABEL_YOU, "out"],
      [namedLabel, "in"],
    ];

    let matched = false;
    for (const [re, who] of openers) {
      const m = line.match(re);
      if (m) {
        flush();
        dir = who;
        if (m[1]?.trim()) buffer.push(m[1].trim());
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // A name on its own line is a speaker header in LinkedIn's transcript.
    if (bareName.test(line)) {
      flush();
      dir = "in";
      continue;
    }
    if (bareYou.test(line)) {
      flush();
      dir = "out";
      continue;
    }

    buffer.push(line);
  }
  flush();

  return out;
}

/** What the parse decided, in words, so it can be checked before committing. */
export function describeParse(messages: ParsedMessage[], contact: Contact): string {
  if (messages.length === 0) return "";
  const theirs = messages.filter((m) => m.dir === "in").length;
  const yours = messages.length - theirs;
  if (theirs && yours) return `Reads as ${theirs} from ${contact.firstName}, ${yours} from you`;
  if (theirs) return theirs === 1 ? `Reads as a message from ${contact.firstName}` : `Reads as ${theirs} from ${contact.firstName}`;
  return yours === 1 ? "Reads as your message" : `Reads as ${yours} from you`;
}
