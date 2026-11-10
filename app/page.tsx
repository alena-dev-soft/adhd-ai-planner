import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Empty planner shell (phase 1). Real layout comes in phase 3.
export default async function PlannerPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  return (
    <main className="mx-auto max-w-[1400px] p-5">
      <div className="grid grid-cols-1 overflow-hidden bg-paper shadow-[0_4px_20px_rgba(0,0,0,0.06)] min-[900px]:grid-cols-2">
        <section className="min-h-[60vh] border-b-2 border-line px-10 py-14 min-[900px]:border-b-0 min-[900px]:border-r-2">
          <h1 className="text-xs font-light uppercase tracking-[2px] text-muted">
            Weekly Planning
          </h1>
        </section>
        <section className="min-h-[60vh] px-10 py-14">
          <h2 className="text-xs font-light uppercase tracking-[2px] text-muted">Daily</h2>
        </section>
      </div>
    </main>
  );
}
