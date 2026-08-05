import type {
  Contact,
  Deal,
  DealStage,
  LiLogEntry,
  LiState,
  Note,
  Sequence,
  SequenceStep,
  Task,
  Thread,
  ThreadState,
} from "../data/types";

export interface CrmState {
  contacts: Contact[];
  threads: Thread[];
  deals: Deal[];
  tasks: Task[];
  notes: Note[];
  liLog: LiLogEntry[];
  sequences: Sequence[];

  /** Composer text keyed by thread id. Absent means "use the seeded draft". */
  compose: Record<number, string>;
  /** Threads whose current draft came out of the AI, so we can say so. */
  aiUsed: Record<number, boolean>;
  /** Per-message expand state, keyed "threadId:index". Absent means default. */
  openMsgs: Record<string, boolean>;
  /** Overridden LinkedIn openers keyed by contact id. */
  liDrafts: Record<number, string>;

  liSentToday: number;
  liWeek: number;
  toast: string;
}

export type Action =
  | { type: "toast"; text: string }
  | { type: "dismissToast" }
  | { type: "setCompose"; tid: number; text: string }
  | { type: "aiApply"; tid: number; text: string }
  | { type: "toggleMsg"; key: string; fallback: boolean }
  | { type: "setSubject"; tid: number; subject: string }
  | { type: "send"; tid: number; text: string; next: ThreadState; status?: Contact["status"]; advance?: boolean }
  | { type: "closeThread"; tid: number; status: Contact["status"]; text: string }
  | { type: "patchContact"; id: number; patch: Partial<Contact> }
  | { type: "saveContact"; id: number; patch: Partial<Contact> }
  | { type: "suppressMany"; ids: number[] }
  | { type: "addContact"; contact: Omit<Contact, "id"> }
  | { type: "importContacts"; contacts: Array<Omit<Contact, "id">>; seqId: number }
  | { type: "createDeal"; cid: number; value?: number }
  | { type: "moveDeal"; id: number; stage: DealStage }
  | { type: "completeTask"; id: number }
  | { type: "addNote"; cid: number; body: string }
  | { type: "liSend"; cid: number }
  | { type: "liSet"; cid: number; li: LiState; note: string }
  | { type: "liRecycle"; cid: number }
  | { type: "liRestore"; cid: number }
  | { type: "liRedraft"; cid: number; text: string }
  | { type: "liLogChat"; cid: number; messages: Array<{ dir: "in" | "out"; body: string }> }
  | { type: "liRegenerate"; cid: number }
  | { type: "liDismissDraft"; cid: number }
  | { type: "saveSequence"; id: number | null; name: string; note: string; steps: SequenceStep[] }
  | { type: "deleteSequence"; id: number }
  | { type: "toggleSequence"; id: number };
