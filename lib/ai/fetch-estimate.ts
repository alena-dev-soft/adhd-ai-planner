import type { Feasibility } from "@/lib/domain/overload";
import type { EstimateRequest } from "@/lib/domain/inputs";

export type Estimate = { targetPomodoros: number; feasibility: Feasibility; note: string };

const FEASIBILITY = new Set(["yes", "warning", "no"]);
const CLIENT_TIMEOUT_MS = 8000; // the server already gives up after 5s

/**
 * Browser side of POST /api/estimate. Returns null on any problem (no AI key,
 * timeout, network, 401, odd body): the caller then simply changes nothing.
 */
export async function fetchEstimate(body: EstimateRequest): Promise<Estimate | null> {
  try {
    const res = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const r = (await res.json()) as Partial<Estimate> | null;
    if (
      typeof r?.targetPomodoros !== "number" ||
      typeof r.feasibility !== "string" ||
      !FEASIBILITY.has(r.feasibility)
    ) {
      return null;
    }
    return { targetPomodoros: r.targetPomodoros, feasibility: r.feasibility, note: r.note ?? "" };
  } catch {
    return null;
  }
}
