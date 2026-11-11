import { NextResponse } from "next/server";
import { estimate, NO_ESTIMATE } from "@/lib/ai/estimator";
import { estimateRequest } from "@/lib/domain/inputs";
import { createClient } from "@/lib/supabase/server";

/**
 * POST { title, category, otherTasks[] } → { targetPomodoros, feasibility, note }.
 * Signed-in users only. AI problems are not errors: they answer
 * { targetPomodoros: null } so the client just leaves the target empty.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const p = estimateRequest.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  try {
    return NextResponse.json(await estimate(p.data));
  } catch {
    return NextResponse.json(NO_ESTIMATE);
  }
}
