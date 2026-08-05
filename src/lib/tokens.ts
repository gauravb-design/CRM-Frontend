import type { Channel, ContactStatus, LiState } from "../data/types";

/**
 * Colour by meaning, defined once. A status pill has to read the same on the
 * contacts table, the inbox sidebar and the record header, or it stops being
 * information and becomes decoration.
 */
export const STATUS_PILL: Record<ContactStatus, string> = {
  New: "bg-stone text-ink2",
  Contacted: "bg-bluesoft text-blue",
  Replied: "bg-greensoft text-green",
  Interested: "bg-green text-white",
  Unqualified: "bg-stone text-muted",
  Unsubscribed: "bg-dangersoft text-danger",
  Bounced: "bg-dangersoft text-danger",
};

export const CHANNEL_PILL: Record<Channel, string> = {
  Email: "bg-stone text-muted",
  LinkedIn: "bg-bluesoft text-blue",
};

export const LI_LABEL: Record<LiState, string> = {
  none: "Not contacted",
  requested: "Request sent",
  accepted: "Accepted",
  messaged: "Message sent",
  conversation: "Replied",
  recycled: "Recycled",
};

/** Past tense, for "requested 4d ago" on a LinkedIn row. */
export const LI_VERB: Record<LiState, string> = {
  none: "",
  requested: "requested",
  accepted: "accepted",
  messaged: "messaged",
  conversation: "replied",
  recycled: "parked",
};

export const LI_PILL: Record<LiState, string> = {
  none: "bg-stone text-muted",
  requested: "bg-bluesoft text-blue",
  accepted: "bg-greensoft text-green",
  messaged: "bg-bluesoft text-blue",
  conversation: "bg-green text-white",
  recycled: "bg-stone text-faint",
};

export const TIMELINE_ICON: Record<string, { glyph: string; cls: string }> = {
  email: { glyph: "✉", cls: "bg-stone text-muted" },
  linkedin: { glyph: "in", cls: "bg-bluesoft text-blue" },
  note: { glyph: "✎", cls: "bg-ambersoft text-amber" },
  task: { glyph: "✓", cls: "bg-stone text-muted" },
  deal: { glyph: "$", cls: "bg-greensoft text-green" },
};
