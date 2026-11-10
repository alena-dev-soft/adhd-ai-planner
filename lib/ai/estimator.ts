import { z } from "zod";
import type { Category } from "@/lib/domain/category";
import type { Feasibility } from "@/lib/domain/overload";

/**
 * AI pomodoro estimate for one day task. One function (`estimate`), so the
 * provider can be swapped without touching the route or UI. Server-only:
 * reads OPENAI_API_KEY. Never throws; any failure → { targetPomodoros: null }.
 */

export type EstimateInput = {
  title: string;
  category: Category;
  otherTasks: string[];
};

export type EstimateResult =
  | { targetPomodoros: number; feasibility: Feasibility; note: string }
  | { targetPomodoros: null };

export const NO_ESTIMATE: EstimateResult = { targetPomodoros: null };
export const TIMEOUT_MS = 5000;
const MODEL = "gpt-4o-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";
const MAX_NOTE = 200;

export const SYSTEM_PROMPT = [
  "You estimate pomodoros (25 minutes each) for one task of an ADHD developer who works night shifts.",
  "Be conservative: ADHD makes starting, focusing and estimating harder, so round up, not down.",
  "Account for task switching: every other task planned for the same shift costs extra time and focus.",
  "A whole shift holds at most 15 pomodoros, including all the other tasks listed.",
  'feasibility: "yes" if the task fits comfortably next to the other tasks, "warning" if the shift gets tight, "no" if it does not fit.',
  "targetPomodoros: an integer from 1 to 8.",
  "note: one short, neutral sentence (max 15 words). No praise, no pressure, no emoji.",
  'Reply with JSON only, exactly: {"targetPomodoros": number, "feasibility": "yes" | "warning" | "no", "note": string}',
].join("\n");

export function userPrompt({ title, category, otherTasks }: EstimateInput): string {
  const others = otherTasks.length ? otherTasks.map((t) => `- ${t}`).join("\n") : "(none)";
  return `Task: ${title}\nCategory: ${category}\nOther tasks planned today:\n${others}`;
}

const reply = z.object({
  targetPomodoros: z.coerce.number().finite(),
  feasibility: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.enum(["yes", "warning", "no"])),
  note: z.string().optional().default(""),
});

/** Strip ``` / ```json fences → zod parse → clamp. Pure; null on any problem. */
export function parseEstimate(text: string): EstimateResult {
  const unfenced = text
    .trim()
    .replace(/^```[a-zA-Z]*\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
  let json: unknown;
  try {
    json = JSON.parse(unfenced);
  } catch {
    return NO_ESTIMATE;
  }
  const p = reply.safeParse(json);
  if (!p.success) return NO_ESTIMATE;
  const note = p.data.note.trim().replace(/\s+/g, " ");
  return {
    targetPomodoros: Math.min(8, Math.max(1, Math.round(p.data.targetPomodoros))),
    feasibility: p.data.feasibility,
    note: note.length > MAX_NOTE ? `${note.slice(0, MAX_NOTE - 1)}…` : note,
  };
}

type Options = { apiKey?: string; fetch?: typeof fetch; timeoutMs?: number };

export async function estimate(input: EstimateInput, opts: Options = {}): Promise<EstimateResult> {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return NO_ESTIMATE; // AI disabled
  const doFetch = opts.fetch ?? fetch;
  const controller = new AbortController();
  // Rejects on timeout even if the fetch ignores the signal.
  const timeout = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new Error("timeout")));
  });
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  try {
    const call = (async () => {
      const res = await doFetch(API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          max_tokens: 150,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt(input) },
          ],
        }),
      });
      if (!res.ok) return NO_ESTIMATE;
      const body = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
      const content = body.choices?.[0]?.message?.content;
      return typeof content === "string" ? parseEstimate(content) : NO_ESTIMATE;
    })();
    call.catch(() => {}); // avoid an unhandled rejection after a timeout
    return await Promise.race([call, timeout]);
  } catch {
    return NO_ESTIMATE;
  } finally {
    clearTimeout(timer);
    timeout.catch(() => {});
  }
}
