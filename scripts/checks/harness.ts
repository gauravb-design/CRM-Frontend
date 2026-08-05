import { initialState, reducer } from "../../src/state/reducer";
import type { Action, CrmState } from "../../src/state/types";

/** Shared tally. Each check module adds to it as it is imported. */
export const results = { pass: 0, fails: [] as string[] };

export function ok(name: string, cond: boolean, detail?: unknown) {
  if (cond) results.pass++;
  else results.fails.push(`${name}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
}

/** Apply actions in order, the way a session of clicking would. */
export const run = (s: CrmState, ...as: Action[]) => as.reduce(reducer, s);

/** The untouched seed. Never mutate — every check branches from it. */
export const S = initialState();
