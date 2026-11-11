"use client";

import { useCallback, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Runs saves one after another (so rapid bubble clicks land in order) and
 * reports a single status for the "saved" indicator.
 */
export function useSaver() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const chain = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);
  const failed = useRef(false);

  const save = useCallback((run: () => Promise<{ ok: boolean }>) => {
    pending.current += 1;
    setStatus("saving");
    chain.current = chain.current.then(async () => {
      let ok = false;
      try {
        ok = (await run()).ok;
      } catch {
        ok = false;
      }
      if (!ok) failed.current = true;
      pending.current -= 1;
      if (pending.current === 0) {
        setStatus(failed.current ? "error" : "saved");
        failed.current = false;
      }
    });
    return chain.current;
  }, []);

  return { status, save };
}
