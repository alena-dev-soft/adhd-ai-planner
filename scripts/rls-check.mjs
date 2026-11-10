// RLS isolation check: two throwaway users A and B; B must not see or change anything of A's.
// Run: npm run check:rls   (needs SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
// Exits 1 if any check fails. Both users are deleted afterwards (cascade removes their rows).
import { createClient } from '@supabase/supabase-js';

for (const k of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!process.env[k]) { console.error(`missing env ${k}`); process.exit(2); }
}
const url = new URL(process.env.SUPABASE_URL).origin;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, opts);
let passed = 0, failed = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passed++; else failed++; };
const PW = 'Pw-test-12345!';
// RLS rejections must fail with 42501 (insufficient_privilege / row-level security), not some other error.
const denied = (r) => r.error?.code === '42501';

async function user(email) {
  const { data: u, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) throw error;
  const c = createClient(url, process.env.SUPABASE_ANON_KEY, opts);
  const { error: e2 } = await c.auth.signInWithPassword({ email, password: PW });
  if (e2) throw e2;
  return { id: u.user.id, c };
}

// Admin snapshot of everything A owns, to prove B's attempts changed nothing.
async function snapshotA(ids) {
  const out = {};
  for (const [t, id] of Object.entries(ids)) {
    out[t] = (await admin.from(t).select('*').eq('id', id).single()).data;
  }
  return JSON.stringify(out);
}

const stamp = Date.now();
const A = await user(`rls-a-${stamp}@example.com`);
const B = await user(`rls-b-${stamp}@example.com`);
try {
  // --- trigger + A's data -------------------------------------------------
  const pa = await A.c.from('profiles').select('*');
  ok(pa.data?.length === 1 && pa.data[0].id === A.id && pa.data[0].rollover_hour === 7
    && pa.data[0].time_zone === 'Asia/Ho_Chi_Minh', 'trigger created profile for A with defaults');
  const w = await A.c.from('weeks').insert({ user_id: A.id, week_start: '2026-11-09' }).select().single();
  ok(!w.error, 'A inserts week');
  const wt = await A.c.from('week_tasks').insert({ week_id: w.data.id, slot: 1, title: 'A secret week task' }).select().single();
  ok(!wt.error, 'A inserts week_task');
  const d = await A.c.from('days').insert({ user_id: A.id, date: '2026-11-10', notes: 'A private notes' }).select().single();
  ok(!d.error, 'A inserts day');
  const dt = await A.c.from('day_tasks').insert({ day_id: d.data.id, slot: 1, title: 'A day task', week_task_id: wt.data.id }).select().single();
  ok(!dt.error, 'A inserts day_task linked to own week_task');

  // --- constraints ---------------------------------------------------------
  ok((await A.c.from('day_tasks').insert({ day_id: d.data.id, slot: 6 })).error, 'constraint: day slot 6 rejected');
  ok((await A.c.from('week_tasks').insert({ week_id: w.data.id, slot: 13 })).error, 'constraint: week slot 13 rejected');
  ok((await A.c.from('days').update({ rating: 11 }).eq('id', d.data.id)).error, 'constraint: rating 11 rejected');
  ok((await A.c.from('day_tasks').update({ feasibility: 'maybe' }).eq('id', dt.data.id)).error, 'constraint: bad feasibility rejected');
  ok((await A.c.from('weeks').insert({ user_id: A.id, week_start: '2026-11-09' })).error, 'constraint: duplicate week rejected');

  const aIds = { profiles: A.id, weeks: w.data.id, week_tasks: wt.data.id, days: d.data.id, day_tasks: dt.data.id };
  const before = await snapshotA(aIds);

  // --- B reads: zero rows --------------------------------------------------
  for (const t of ['weeks', 'week_tasks', 'days', 'day_tasks']) {
    const r = await B.c.from(t).select('*');
    ok(!r.error && r.data.length === 0, `B select * from ${t} → 0 rows`);
  }
  const bp = await B.c.from('profiles').select('*');
  ok(!bp.error && bp.data.length === 1 && bp.data[0].id === B.id, 'B select * from profiles → only own row');
  for (const [t, id] of Object.entries(aIds)) {
    const r = await B.c.from(t).select('*').eq('id', id);
    ok(!r.error && r.data.length === 0, `B select A's ${t} by id → 0 rows`);
  }

  // --- B updates / deletes A's rows: 0 rows affected -----------------------
  const patch = { profiles: { display_name: 'hacked' }, weeks: { week_start: '2026-11-16' },
    week_tasks: { title: 'hacked', is_done: true }, days: { notes: 'hacked' }, day_tasks: { title: 'hacked' } };
  for (const [t, id] of Object.entries(aIds)) {
    const r = await B.c.from(t).update(patch[t]).eq('id', id).select();
    ok(!r.error && r.data.length === 0, `B update A's ${t} → 0 rows`);
  }
  for (const t of ['day_tasks', 'week_tasks', 'days', 'weeks', 'profiles']) {
    const r = await B.c.from(t).delete().eq('id', aIds[t]).select();
    ok(!r.error && r.data.length === 0, `B delete A's ${t} → 0 rows`);
  }

  // --- B inserts into A's space: rejected ----------------------------------
  ok(denied(await B.c.from('weeks').insert({ user_id: A.id, week_start: '2026-11-16' })), 'B insert week with user_id=A rejected');
  ok(denied(await B.c.from('days').insert({ user_id: A.id, date: '2026-11-11' })), 'B insert day with user_id=A rejected');
  ok(denied(await B.c.from('week_tasks').insert({ week_id: w.data.id, slot: 2, title: 'x' })), "B insert week_task into A's week rejected");
  ok(denied(await B.c.from('day_tasks').insert({ day_id: d.data.id, slot: 2, title: 'x' })), "B insert day_task into A's day rejected");

  // --- B moves its own rows into A's space: rejected ----------------------
  const bw = await B.c.from('weeks').insert({ user_id: B.id, week_start: '2026-11-09' }).select().single();
  const bwt = await B.c.from('week_tasks').insert({ week_id: bw.data.id, slot: 1, title: 'B week task' }).select().single();
  const bd = await B.c.from('days').insert({ user_id: B.id, date: '2026-11-10' }).select().single();
  const bdt = await B.c.from('day_tasks').insert({ day_id: bd.data.id, slot: 1, title: 'B day task' }).select().single();
  ok(!bw.error && !bwt.error && !bd.error && !bdt.error, 'B inserts own week/week_task/day/day_task (same dates as A ok)');
  ok(denied(await B.c.from('weeks').update({ user_id: A.id }).eq('id', bw.data.id)), 'B reassign own week to A rejected');
  ok(denied(await B.c.from('days').update({ user_id: A.id }).eq('id', bd.data.id)), 'B reassign own day to A rejected');
  ok(denied(await B.c.from('week_tasks').update({ week_id: w.data.id }).eq('id', bwt.data.id)), "B move own week_task into A's week rejected");
  ok(denied(await B.c.from('day_tasks').update({ day_id: d.data.id }).eq('id', bdt.data.id)), "B move own day_task into A's day rejected");
  ok(denied(await B.c.from('day_tasks').update({ week_task_id: wt.data.id }).eq('id', bdt.data.id)), "B link own day_task to A's week_task (update) rejected");
  ok(denied(await B.c.from('day_tasks').insert({ day_id: bd.data.id, slot: 2, week_task_id: wt.data.id })), "B link A's week_task (insert) rejected");
  // upsert by A's primary key must not overwrite A's row
  ok(denied(await B.c.from('day_tasks').upsert({ id: dt.data.id, day_id: bd.data.id, slot: 3, title: 'hacked' })), "B upsert onto A's day_task id rejected");
  ok(denied(await B.c.from('weeks').upsert({ id: w.data.id, user_id: B.id, week_start: '2026-12-07' })), "B upsert onto A's week id rejected");

  // --- A's data unchanged, and A still can't see B's -----------------------
  ok((await snapshotA(aIds)) === before, "A's rows byte-identical after all of B's attempts (admin view)");
  const ad = await A.c.from('days').select('id');
  ok(ad.data?.length === 1 && ad.data[0].id === d.data.id, "A sees only own day, not B's");

  // --- quotes + anon -------------------------------------------------------
  const q = await B.c.from('quotes').select('id');
  ok(!q.error, 'authenticated can read quotes');
  ok(denied(await B.c.from('quotes').insert({ text: 'x' })), 'authenticated cannot insert quotes');
  const anon = createClient(url, process.env.SUPABASE_ANON_KEY, opts);
  for (const t of ['quotes', 'profiles', 'weeks', 'week_tasks', 'days', 'day_tasks']) {
    const r = await anon.from(t).select('*');
    ok(r.error || r.data.length === 0, `anon cannot read ${t}`);
  }
  ok((await anon.from('weeks').insert({ user_id: A.id, week_start: '2026-11-23' })).error, 'anon cannot insert weeks');
} finally {
  await admin.auth.admin.deleteUser(A.id);
  await admin.auth.admin.deleteUser(B.id);
  for (const t of ['weeks', 'days']) {
    const left = await admin.from(t).select('id').in('user_id', [A.id, B.id]);
    ok((left.data ?? []).length === 0, `cascade: deleting users removes their ${t}`);
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
}
