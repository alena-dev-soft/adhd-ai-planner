-- Quotes for the daily page (CLAUDE.md §5). Short productivity/focus quotes.
-- Idempotent: rows already present (same text) are skipped, so this can be
-- re-run against the hosted DB without duplicates and without touching days.quote_id.
insert into public.quotes (text, author)
select v.text, v.author
from (values
  ('The only way to do great work is to love what you do.', 'Steve Jobs'),
  ('Focusing is about saying no.', 'Steve Jobs'),
  ('Simple can be harder than complex.', 'Steve Jobs'),
  ('Success is the sum of small efforts, repeated day in and day out.', 'Robert Collier'),
  ('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson'),
  ('Do the hard jobs first. The easy jobs will take care of themselves.', 'Dale Carnegie'),
  ('Well begun is half done.', 'Aristotle'),
  ('Concentrate all your thoughts upon the work at hand. The sun''s rays do not burn until brought to a focus.', 'Alexander Graham Bell'),
  ('How we spend our days is, of course, how we spend our lives.', 'Annie Dillard'),
  ('Lost time is never found again.', 'Benjamin Franklin'),
  ('You may delay, but time will not.', 'Benjamin Franklin'),
  ('Energy and persistence conquer all things.', 'Benjamin Franklin'),
  ('Nothing is particularly hard if you divide it into small jobs.', 'Henry Ford'),
  ('Amateurs sit and wait for inspiration, the rest of us just get up and go to work.', 'Stephen King'),
  ('Perfection is not attainable, but if we chase perfection we can catch excellence.', 'Vince Lombardi'),
  ('Focus is a matter of deciding what things you''re not going to do.', 'John Carmack'),
  ('A year from now you may wish you had started today.', 'Karen Lamb'),
  ('Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.', 'Paul J. Meyer'),
  ('Until we can manage time, we can manage nothing else.', 'Peter Drucker'),
  ('There is nothing so useless as doing efficiently that which should not be done at all.', 'Peter Drucker'),
  ('The key is not to prioritize what''s on your schedule, but to schedule your priorities.', 'Stephen Covey'),
  ('The main thing is to keep the main thing the main thing.', 'Stephen Covey'),
  ('I am not a product of my circumstances. I am a product of my decisions.', 'Stephen Covey'),
  ('If you spend too much time thinking about a thing, you''ll never get it done.', 'Bruce Lee'),
  ('Plans are worthless, but planning is everything.', 'Dwight D. Eisenhower'),
  ('You can do anything, but not everything.', 'David Allen'),
  ('Your mind is for having ideas, not holding them.', 'David Allen'),
  ('Rest is not idleness.', 'John Lubbock'),
  ('The best way out is always through.', 'Robert Frost'),
  ('We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant'),
  ('You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear'),
  ('Every action you take is a vote for the type of person you wish to become.', 'James Clear'),
  ('Clarity about what matters provides clarity about what does not.', 'Cal Newport'),
  ('Talk is cheap. Show me the code.', 'Linus Torvalds'),
  ('Make it work, make it right, make it fast.', 'Kent Beck'),
  ('Premature optimization is the root of all evil.', 'Donald Knuth'),
  ('Almost everything will work again if you unplug it for a few minutes, including you.', 'Anne Lamott'),
  ('Nothing will work unless you do.', 'Maya Angelou'),
  ('Do what you can, with what you have, where you are.', 'Theodore Roosevelt'),
  ('Be not afraid of going slowly; be afraid only of standing still.', 'Chinese proverb')
) as v(text, author)
where not exists (select 1 from public.quotes q where q.text = v.text);
