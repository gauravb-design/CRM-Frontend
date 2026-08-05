import type { Action, CrmState } from "./types";

type SequenceAction = Extract<
  Action,
  { type: "saveSequence" } | { type: "deleteSequence" } | { type: "toggleSequence" }
>;

export const isSequenceAction = (a: Action): a is SequenceAction =>
  a.type === "saveSequence" || a.type === "deleteSequence" || a.type === "toggleSequence";

/**
 * The builder saves whole sequences rather than dispatching per keystroke:
 * the page holds a working copy, and one action commits it. That keeps step
 * reordering and editing out of the store entirely.
 */
export function sequenceReducer(s: CrmState, a: SequenceAction): CrmState {
  switch (a.type) {
    case "saveSequence": {
      if (a.id === null) {
        const id = Math.max(0, ...s.sequences.map((q) => q.id)) + 1;
        return {
          ...s,
          sequences: [...s.sequences, { id, name: a.name, note: a.note, active: true, steps: a.steps }],
          toast: `${a.name} created with ${a.steps.length} steps.`,
        };
      }
      return {
        ...s,
        sequences: s.sequences.map((q) =>
          q.id === a.id ? { ...q, name: a.name, note: a.note, steps: a.steps } : q,
        ),
        toast: `${a.name} saved.`,
      };
    }

    case "deleteSequence": {
      const seq = s.sequences.find((q) => q.id === a.id);
      const enrolled = s.contacts.filter((c) => c.seqId === a.id).length;
      if (enrolled > 0) {
        return {
          ...s,
          toast: `${enrolled} contacts are still on that sequence. Move them off it first.`,
        };
      }
      return {
        ...s,
        sequences: s.sequences.filter((q) => q.id !== a.id),
        toast: seq ? `${seq.name} deleted.` : "",
      };
    }

    case "toggleSequence": {
      const seq = s.sequences.find((q) => q.id === a.id);
      if (!seq) return s;
      return {
        ...s,
        sequences: s.sequences.map((q) => (q.id === a.id ? { ...q, active: !q.active } : q)),
        toast: seq.active
          ? `${seq.name} paused. Nothing further will send on it.`
          : `${seq.name} live again.`,
      };
    }
  }
}
