import { createClient } from '@supabase/supabase-js';
const url = new URL(process.env.SUPABASE_URL).origin;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
async function user(email) {
  const { data: u, error } = await admin.auth.admin.createUser({ email, password: 'Pw-test-12345!', email_confirm: true });
  if (error) throw error;
  const c = createClient(url, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error: e2 } = await c.auth.signInWithPassword({ email, password: 'Pw-test-12345!' });
  if (e2) throw e2;
  return { id: u.user.id, c };
}
const A = await user(`rls-a-${Date.now()}@example.com`), B = await user(`rls-b-${Date.now()}@example.com`);
try {
  const pa = await A.c.from('profiles').select('*');
  ok(pa.data?.length === 1 && pa.data[0].id === A.id && pa.data[0].rollover_hour === 7 && pa.data[0].time_zone === 'Asia/Ho_Chi_Minh', 'trigger created profile for A with defaults');
  const w = await A.c.from('weeks').insert({ user_id: A.id, week_start: '2026-11-09' }).select().single();
  ok(!w.error, 'A inserts week ' + (w.error?.message ?? ''));
  const wt = await A.c.from('week_tasks').insert({ week_id: w.data.id, slot: 1, title: 'A secret week task' }).select().single();
  ok(!wt.error, 'A inserts week_task');
  const d = await A.c.from('days').insert({ user_id: A.id, date: '2026-11-10' }).select().single();
  ok(!d.error, 'A inserts day');
  const dt = await A.c.from('day_tasks').insert({ day_id: d.data.id, slot: 1, title: 'A day task', week_task_id: wt.data.id }).select().single();
  ok(!dt.error, 'A inserts day_task linked to own week_task');
  ok((await A.c.from('day_tasks').insert({ day_id: d.data.id, slot: 6 })).error, 'slot 6 rejected');
  ok((await A.c.from('days').update({ rating: 11 }).eq('id', d.data.id)).error, 'rating 11 rejected');
  ok((await A.c.from('day_tasks').update({ feasibility: 'maybe' }).eq('id', dt.data.id)).error, 'bad feasibility rejected');
  ok((await A.c.from('weeks').insert({ user_id: A.id, week_start: '2026-11-09' })).error, 'duplicate week rejected');

  for (const t of ['profiles', 'weeks', 'week_tasks', 'days', 'day_tasks']) {
    const r = await B.c.from(t).select('*');
    const leak = (r.data ?? []).filter(x => [A.id, w.data.id, wt.data.id, d.data.id, dt.data.id].includes(x.id) || x.user_id === A.id);
    ok(!r.error && leak.length === 0, `B cannot read A's ${t}`);
  }
  const bu = await B.c.from('day_tasks').update({ title: 'hacked' }).eq('id', dt.data.id).select();
  ok((bu.data ?? []).length === 0, 'B cannot update A day_task');
  const bd = await B.c.from('weeks').delete().eq('id', w.data.id).select();
  ok((bd.data ?? []).length === 0, 'B cannot delete A week');
  ok((await B.c.from('weeks').insert({ user_id: A.id, week_start: '2026-11-16' })).error, 'B cannot insert week for A');
  ok((await B.c.from('week_tasks').insert({ week_id: w.data.id, slot: 2, title: 'x' })).error, 'B cannot insert into A week');
  const bday = await B.c.from('days').insert({ user_id: B.id, date: '2026-11-10' }).select().single();
  ok(!bday.error, 'B inserts own day (same date as A ok)');
  ok((await B.c.from('day_tasks').insert({ day_id: bday.data.id, slot: 1, week_task_id: wt.data.id })).error, "B cannot link A's week_task");
  ok((await B.c.from('profiles').update({ display_name: 'x' }).eq('id', A.id).select()).data?.length === 0, 'B cannot update A profile');
  const q = await B.c.from('quotes').select('*');
  ok(!q.error, 'authenticated can read quotes');
  ok((await B.c.from('quotes').insert({ text: 'x' })).error, 'authenticated cannot insert quotes');
  const anon = createClient(url, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const aq = await anon.from('quotes').select('*'); const aw = await anon.from('weeks').select('*');
  ok(aq.error || aq.data.length === 0, 'anon cannot read quotes'); ok(aw.error || aw.data.length === 0, 'anon cannot read weeks');
  // still intact for A
  const still = await A.c.from('day_tasks').select('title').eq('id', dt.data.id).single();
  ok(still.data?.title === 'A day task', 'A data intact');
} finally {
  await admin.auth.admin.deleteUser(A.id); await admin.auth.admin.deleteUser(B.id);
  const left = await admin.from('weeks').select('id').eq('user_id', A.id);
  ok((left.data ?? []).length === 0, 'cascade: deleting user removes weeks');
}
