import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import { initialState, reducer } from "./reducer";
import type { Action, CrmState } from "./types";

interface Ctx {
  state: CrmState;
  dispatch: Dispatch<Action>;
}

const CrmContext = createContext<Ctx | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  // One timer for the toast, restarted whenever a new one arrives. Doing this
  // in the reducer would make it impure, and doing it per-caller means every
  // action site has to remember.
  useEffect(() => {
    if (!state.toast) return;
    const id = window.setTimeout(() => dispatch({ type: "dismissToast" }), 3200);
    return () => window.clearTimeout(id);
  }, [state.toast]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): Ctx {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside <CrmProvider>");
  return ctx;
}
