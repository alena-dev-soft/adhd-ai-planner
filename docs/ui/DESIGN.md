# ADH Planner — UI Design: Fantasy Themes

Companion file: `themes.css` (all tokens, component styles and animations, ready to use).

## 1. Concept

The paper-planner structure stays (weekly page on the left, day page on the right, close-the-day, weekly review), but the look moves from "paper" to light fantasy. The user picks one of three themes. Each theme changes colors, fonts, corner radius, background, the **shape of the pomodoro bubble**, and the **section names**. Layout and behavior are identical across themes.

## 2. Themes

| | Grimoire (default) | Star Chart | Grove |
|---|---|---|---|
| Mood | dark spellbook, gold on violet | night sky, gold stars on navy | light forest, moss + firefly light |
| `data-theme` | `grimoire` | `astral` | `forest` |
| Heading font | Cinzel 500/700 | Marcellus | Alegreya SC 500/700 |
| Body font | EB Garamond 400/500 | Cormorant Garamond 500/600 | Alegreya 400/500/700 |
| Radius | 6px | 20px | 14px |
| Bubble shape | orb (circle + shine) | 5-point star | firefly (dot + halo, dashed when empty) |
| Pomodoro unit | mana | stars | fireflies |
| Close-day button | Seal the day | Chart the sky | Rest the grove |
| Sealed stamp | Day sealed | Sky charted | Grove at rest |
| Notes title | Scroll of notes | Observations | Field notes |

Section names:

| Slot group | Grimoire | Star Chart | Grove |
|---|---|---|---|
| Week 1–5 | Main Quests | Bright Stars | Great Oaks |
| Week 6–10 | Side Quests | Lesser Stars | Saplings |
| Week 11–12 | Errands | Stardust | Seeds |
| Week page title | Quests of the Week | Constellations of the Week | The Week in the Grove |
| Day slot 1 | The Main Quest | The North Star | The Heartwood Task |
| Day slots 2–3 | Side Quests | Guiding Stars | Saplings |
| Day slots 4–5 | Errands | Stardust | Seeds |

Subtitles are the same in every theme:
- Week 1–5: "If these were the only ones you completed this week, you'd be satisfied."
- Week 6–10: "Only after the ones above." · Week 11–12: "When everything else is done."
- Day 1: "If this was the only thing you did today, you'd be satisfied."
- Day 2–3: "Completing these makes the day even better." · Day 4–5: "Only after the tasks above."

The app title is always **Planner** (not themed).

Colors, exact values: see `themes.css`. All text pairs meet WCAG AA.

## 3. Layout

- Max width 1280px, centered; page padding 32px 24px.
- **Header:** "Planner" (heading font, 26px, letter-spacing 3px) + subline "{done} / {target} {unit} gathered today". Right side: theme switcher (3 pills).
- **Nav row:** ‹ · "Week of 9 November" · › · Mon–Sun pills (selected = accent fill).
- **Pages:** flex-wrap row, gap 24px. Week page `flex: 1 1 460px`, day page `flex: 1 1 560px`. Below ~1000px they stack (week first). Page padding 32px, inner gap 22px.
- **Day page, top to bottom:** date (left) + weekday (right, uppercase) → quote (italic 22px, centered) with author (uppercase 12px muted) → 3 task groups → notes → close-the-day.

## 4. Components

**Task row (day):** `num · title · target box · 5 bubbles · actual box · check button`. Wraps on narrow screens (bubbles go to the next line).
**Task row (week):** `num · title · check button`.
**Bubble:** 38×44 hit area, 22px glyph, `<button aria-pressed>`, aria-label "Pomodoro N for {task}". Markup per shape is in section 6.
**Check button:** 44×44, circle + checkmark path + 6-dot spark burst.
**Pill, Button (`.btn`, `.btn.solid`, `.btn.ghost`), Rating (1–10 round buttons), Field (`.field`)** — styles in `themes.css`.

All interactive elements are real `<button>` / `<input>` / `<textarea>` with labels; touch targets ≥ 44px.

## 5. Motion

| Event | Animation | Trigger |
|---|---|---|
| Bubble filled | glyph scales 0.15 → 1.45 → 1, gold ring expands and fades | `data-pop="true"` on the bubble just filled only |
| Bubble lit (idle) | soft breathing opacity 1 ↔ 0.72, 3.4s, + glow drop-shadow | `aria-pressed="true"` |
| Bubble unfilled | fades out 0.2s | click on the last lit bubble |
| Task done | checkmark draws in, circle fills with accent, title strikes through left→right (0.5s) and dims | `data-done="true"` on the row |
| Task done (moment) | 6 sparks fly out of the check button (0.7s) | `data-spark="true"` only right after the click, never on load |
| Close the day opens | panel unfolds from top (0.45s) | `.unfold` on mount |
| Day sealed | round stamp drops in from 2.4× scale with rotation, lands at −8° with glow | `.seal` on mount |
| Theme switch | background, colors, radius cross-fade 0.6s | change `data-theme` |

`prefers-reduced-motion: reduce` disables all animations and transitions (already in `themes.css`).

## 6. Bubble SVG markup

All use `viewBox="0 0 20 20"`, `aria-hidden="true"`; the `<button class="bub" data-shape="…">` wraps it.

Orb (grimoire):
```html
<circle class="empty" cx="10" cy="10" r="7.5"/>
<circle class="fill" cx="10" cy="10" r="7.5"/>
<circle class="fill shine" cx="7.6" cy="7.4" r="2"/>
<circle class="ring" cx="10" cy="10" r="8"/>
```
Star (astral):
```html
<path class="empty" d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.8L10 14.8l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z"/>
<path class="fill"  d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.8L10 14.8l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z"/>
<circle class="ring" cx="10" cy="10" r="8"/>
```
Firefly (forest):
```html
<circle class="empty" cx="10" cy="10" r="5"/>
<circle class="fill halo" cx="10" cy="10" r="9"/>
<circle class="fill" cx="10" cy="10" r="4.5"/>
<circle class="ring" cx="10" cy="10" r="8"/>
```

Check button:
```html
<svg viewBox="0 0 24 24" aria-hidden="true">
  <circle class="c" cx="12" cy="12" r="9"/>
  <path class="m" d="M7.5 12.5l3 3 6-6.5"/>
</svg>
<span class="burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
```

## 7. Quotes

The quote pool stays shared across themes (random per day, fixed once picked). Use only public-domain or short attributed quotes.
