/**
 * Theme registry (docs/ui/DESIGN.md §2). Every themed string lives here;
 * components read them through `useTheme()` and never hard-code them.
 * Plain module (no "use client"): the root layout imports it for the no-flash script.
 */

export const THEME_KEYS = ["grimoire", "astral", "forest"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export const DEFAULT_THEME: ThemeKey = "grimoire";

/** localStorage key used by the inline head script and the ThemeProvider. */
export const THEME_STORAGE_KEY = "adh-theme";

/** Matches `.bub[data-shape]` in themes.css (`fly` = firefly). */
export type BubbleShape = "orb" | "star" | "fly";

export type Theme = {
  key: ThemeKey;
  label: string;
  bubbleShape: BubbleShape;
  /** Plural pomodoro unit, e.g. "{done} / {target} mana gathered today". */
  pomodoroUnit: string;
  closeDayButton: string;
  sealedStamp: string;
  notesTitle: string;
  weekPageTitle: string;
  /** Week groups: slots 1–5, 6–10, 11–12. */
  weekGroups: readonly [string, string, string];
  /** Day groups: slot 1, slots 2–3, slots 4–5. */
  dayGroups: readonly [string, string, string];
};

export const THEMES: Record<ThemeKey, Theme> = {
  grimoire: {
    key: "grimoire",
    label: "Grimoire",
    bubbleShape: "orb",
    pomodoroUnit: "mana",
    closeDayButton: "Seal the day",
    sealedStamp: "Day sealed",
    notesTitle: "Scroll of notes",
    weekPageTitle: "Quests of the Week",
    weekGroups: ["Main Quests", "Side Quests", "Errands"],
    dayGroups: ["The Main Quest", "Side Quests", "Errands"],
  },
  astral: {
    key: "astral",
    label: "Star Chart",
    bubbleShape: "star",
    pomodoroUnit: "stars",
    closeDayButton: "Chart the sky",
    sealedStamp: "Sky charted",
    notesTitle: "Observations",
    weekPageTitle: "Constellations of the Week",
    weekGroups: ["Bright Stars", "Lesser Stars", "Stardust"],
    dayGroups: ["The North Star", "Guiding Stars", "Stardust"],
  },
  forest: {
    key: "forest",
    label: "Grove",
    bubbleShape: "fly",
    pomodoroUnit: "fireflies",
    closeDayButton: "Rest the grove",
    sealedStamp: "Grove at rest",
    notesTitle: "Field notes",
    weekPageTitle: "The Week in the Grove",
    weekGroups: ["Great Oaks", "Saplings", "Seeds"],
    dayGroups: ["The Heartwood Task", "Saplings", "Seeds"],
  },
};

export const THEME_LIST: readonly Theme[] = THEME_KEYS.map((k) => THEMES[k]);

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === "string" && (THEME_KEYS as readonly string[]).includes(value);
}

export type PageKind = "week" | "day";

/** Slot ranges and subtitles, identical in every theme. */
const GROUP_LAYOUT: Record<PageKind, readonly { slots: readonly number[]; subtitle: string }[]> = {
  week: [
    { slots: [1, 2, 3, 4, 5], subtitle: "If these were the only ones you completed this week, you'd be satisfied." },
    { slots: [6, 7, 8, 9, 10], subtitle: "Only after the ones above." },
    { slots: [11, 12], subtitle: "When everything else is done." },
  ],
  day: [
    { slots: [1], subtitle: "If this was the only thing you did today, you'd be satisfied." },
    { slots: [2, 3], subtitle: "Completing these makes the day even better." },
    { slots: [4, 5], subtitle: "Only after the tasks above." },
  ],
};

export type SlotGroup = { label: string; subtitle: string; slots: readonly number[] };

/** The three task groups of a week or day page for a theme, in order. */
export function slotGroups(theme: Theme, kind: PageKind): SlotGroup[] {
  const labels = kind === "week" ? theme.weekGroups : theme.dayGroups;
  return GROUP_LAYOUT[kind].map((g, i) => ({ label: labels[i], subtitle: g.subtitle, slots: g.slots }));
}

/** Group label and subtitle for one week slot (1–12) or day slot (1–5). */
export function slotGroup(theme: Theme, kind: PageKind, slot: number): SlotGroup {
  const group = slotGroups(theme, kind).find((g) => g.slots.includes(slot));
  if (!group) throw new RangeError(`No ${kind} group for slot ${slot}`);
  return group;
}

/**
 * Inline <head> script: applies the saved theme before first paint.
 * Only accepts known keys; anything else leaves the server default.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(${JSON.stringify(THEME_KEYS)}.indexOf(t)>-1)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
