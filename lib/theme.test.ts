import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEME_INIT_SCRIPT, THEME_KEYS, THEMES, isThemeKey, slotGroup, slotGroups } from "./theme";

describe("theme registry", () => {
  it("has the three themes with grimoire as default", () => {
    expect(THEME_KEYS).toEqual(["grimoire", "astral", "forest"]);
    expect(DEFAULT_THEME).toBe("grimoire");
    expect(THEMES.astral.label).toBe("Star Chart");
    expect(THEMES.forest.bubbleShape).toBe("fly");
  });

  it("validates keys", () => {
    expect(isThemeKey("forest")).toBe(true);
    expect(isThemeKey("dark")).toBe(false);
    expect(isThemeKey(null)).toBe(false);
  });

  it("maps every week and day slot to a group", () => {
    for (const t of Object.values(THEMES)) {
      expect(slotGroups(t, "week").flatMap((g) => g.slots)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      expect(slotGroups(t, "day").flatMap((g) => g.slots)).toEqual([1, 2, 3, 4, 5]);
    }
    expect(slotGroup(THEMES.grimoire, "week", 7).label).toBe("Side Quests");
    expect(slotGroup(THEMES.astral, "day", 1).label).toBe("The North Star");
    expect(slotGroup(THEMES.forest, "day", 5)).toMatchObject({ label: "Seeds", subtitle: "Only after the tasks above." });
    expect(() => slotGroup(THEMES.grimoire, "day", 6)).toThrow(RangeError);
  });

  it("subtitles are shared across themes", () => {
    const subs = (k: keyof typeof THEMES) => slotGroups(THEMES[k], "week").map((g) => g.subtitle);
    expect(subs("astral")).toEqual(subs("grimoire"));
    expect(subs("forest")).toEqual(subs("grimoire"));
  });

  it("init script only applies known keys", () => {
    const run = (stored: string | null) => {
      const attrs: Record<string, string> = {};
      const document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
      const localStorage = { getItem: () => stored };
      new Function("document", "localStorage", THEME_INIT_SCRIPT)(document, localStorage);
      return attrs["data-theme"];
    };
    expect(run("astral")).toBe("astral");
    expect(run("evil")).toBeUndefined();
    expect(run(null)).toBeUndefined();
  });
});
