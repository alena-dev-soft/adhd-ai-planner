import { describe, expect, it, vi } from "vitest";
import { estimate, parseEstimate, SYSTEM_PROMPT } from "./estimator";

const input = { title: "Fix ABC database", category: "important" as const, otherTasks: ["Review CPC codes"] };

function openAiResponse(content: string, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(content: string, status = 200) {
  return vi.fn<typeof fetch>(async () => openAiResponse(content, status));
}

describe("parseEstimate", () => {
  it("parses valid JSON", () => {
    expect(parseEstimate('{"targetPomodoros":3,"feasibility":"yes","note":"Fits the shift."}')).toEqual({
      targetPomodoros: 3,
      feasibility: "yes",
      note: "Fits the shift.",
    });
  });

  it("strips code fences", () => {
    const fenced = '```json\n{"targetPomodoros":2,"feasibility":"warning","note":"Tight."}\n```';
    expect(parseEstimate(fenced)).toEqual({ targetPomodoros: 2, feasibility: "warning", note: "Tight." });
    expect(parseEstimate('```\n{"targetPomodoros":2,"feasibility":"no"}\n```')).toEqual({
      targetPomodoros: 2,
      feasibility: "no",
      note: "",
    });
  });

  it("clamps targetPomodoros to 1–8 and rounds", () => {
    expect(parseEstimate('{"targetPomodoros":12,"feasibility":"no","note":""}')).toMatchObject({ targetPomodoros: 8 });
    expect(parseEstimate('{"targetPomodoros":0,"feasibility":"yes","note":""}')).toMatchObject({ targetPomodoros: 1 });
    expect(parseEstimate('{"targetPomodoros":-4,"feasibility":"yes","note":""}')).toMatchObject({ targetPomodoros: 1 });
    expect(parseEstimate('{"targetPomodoros":2.6,"feasibility":"yes","note":""}')).toMatchObject({ targetPomodoros: 3 });
    expect(parseEstimate('{"targetPomodoros":"4","feasibility":"yes","note":""}')).toMatchObject({ targetPomodoros: 4 });
  });

  it("normalises feasibility case and rejects unknown values", () => {
    expect(parseEstimate('{"targetPomodoros":2,"feasibility":" Warning ","note":""}')).toMatchObject({
      feasibility: "warning",
    });
    expect(parseEstimate('{"targetPomodoros":2,"feasibility":"maybe","note":""}')).toEqual({ targetPomodoros: null });
  });

  it("returns null for garbage", () => {
    for (const bad of ["", "not json", "{", "[]", "null", '{"feasibility":"yes"}', '{"targetPomodoros":"x","feasibility":"yes"}']) {
      expect(parseEstimate(bad)).toEqual({ targetPomodoros: null });
    }
  });

  it("caps a long note", () => {
    const r = parseEstimate(JSON.stringify({ targetPomodoros: 1, feasibility: "yes", note: "a ".repeat(300) }));
    expect(r.targetPomodoros).toBe(1);
    if (r.targetPomodoros !== null) expect(r.note.length).toBeLessThanOrEqual(200);
  });
});

describe("estimate", () => {
  it("returns the parsed estimate for a valid reply", async () => {
    const f = mockFetch('{"targetPomodoros":3,"feasibility":"yes","note":"Fits."}');
    await expect(estimate(input, { apiKey: "k", fetch: f })).resolves.toEqual({
      targetPomodoros: 3,
      feasibility: "yes",
      note: "Fits.",
    });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.messages[0].content).toBe(SYSTEM_PROMPT);
    expect(body.messages[1].content).toContain("Fix ABC database");
    expect(body.messages[1].content).toContain("Review CPC codes");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer k");
  });

  it("handles a fenced reply", async () => {
    const f = mockFetch('```json\n{"targetPomodoros":5,"feasibility":"warning","note":"Tight."}\n```');
    await expect(estimate(input, { apiKey: "k", fetch: f })).resolves.toMatchObject({ targetPomodoros: 5 });
  });

  it("clamps an out-of-range reply", async () => {
    const f = mockFetch('{"targetPomodoros":40,"feasibility":"no","note":"Too big."}');
    await expect(estimate(input, { apiKey: "k", fetch: f })).resolves.toMatchObject({ targetPomodoros: 8 });
  });

  it("returns null for a garbage reply", async () => {
    await expect(estimate(input, { apiKey: "k", fetch: mockFetch("Sure! About 3 pomodoros.") })).resolves.toEqual({
      targetPomodoros: null,
    });
  });

  it("returns null for a non-OK HTTP status", async () => {
    const f = mockFetch('{"targetPomodoros":3,"feasibility":"yes","note":""}', 500);
    await expect(estimate(input, { apiKey: "k", fetch: f })).resolves.toEqual({ targetPomodoros: null });
  });

  it("returns null for a malformed response body", async () => {
    const f = vi.fn<typeof fetch>(async () => new Response("<html>", { status: 200 }));
    await expect(estimate(input, { apiKey: "k", fetch: f })).resolves.toEqual({ targetPomodoros: null });
  });

  it("returns null when fetch throws", async () => {
    const f = vi.fn<typeof fetch>(async () => {
      throw new TypeError("network");
    });
    await expect(estimate(input, { apiKey: "k", fetch: f })).resolves.toEqual({ targetPomodoros: null });
  });

  it("times out after 5s and aborts the request", async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const f = vi.fn<typeof fetch>((_, init) => {
        signal = init?.signal ?? undefined;
        return new Promise<Response>(() => {}); // never resolves, ignores the signal
      });
      const p = estimate(input, { apiKey: "k", fetch: f });
      await vi.advanceTimersByTimeAsync(4999);
      expect(signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await expect(p).resolves.toEqual({ targetPomodoros: null });
      expect(signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not call fetch without an API key", async () => {
    const f = mockFetch("{}");
    const saved = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      await expect(estimate(input, { fetch: f })).resolves.toEqual({ targetPomodoros: null });
      expect(f).not.toHaveBeenCalled();
    } finally {
      if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
    }
  });
});
