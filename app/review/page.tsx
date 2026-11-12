import { redirect } from "next/navigation";
import { ReviewView } from "@/components/ReviewView";
import { resolveSelection } from "@/lib/domain/selection";
import { userToday } from "@/lib/planner";
import { loadReview } from "@/lib/review";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Weekly review. `?week=YYYY-MM-DD` (any day, normalised to Monday); default: the current week. */
export default async function ReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const params = await searchParams;
  const today = await userToday(supabase, userId);
  const { weekStart } = resolveSelection({ week: first(params.week) }, today);
  const review = await loadReview(supabase, userId, weekStart);
  return <ReviewView review={review} weekStart={weekStart} />;
}
