import { describe, expect, it } from "vitest";
import { bubbleDisplay, clickBubble } from "./bubbles";

describe("clickBubble", () => {
  it("clicking bubble N sets completed = N", () => {
    expect(clickBubble(0, 3)).toBe(3);
    expect(clickBubble(1, 5)).toBe(5);
    expect(clickBubble(4, 2)).toBe(2);
  });

  it("clicking the last filled bubble removes one", () => {
    expect(clickBubble(3, 3)).toBe(2);
    expect(clickBubble(1, 1)).toBe(0);
    expect(clickBubble(5, 5)).toBe(4);
  });

  it("over 5, bubble 5 is the last filled one", () => {
    expect(clickBubble(7, 5)).toBe(6);
    expect(clickBubble(7, 2)).toBe(2);
  });

  it("rejects bubbles outside 1–5", () => {
    for (const n of [0, 6, 2.5]) expect(() => clickBubble(2, n)).toThrow(RangeError);
  });
});

describe("bubbleDisplay", () => {
  it("fills up to 5 without overflow", () => {
    expect(bubbleDisplay(0)).toEqual({ filled: 0, overflow: null });
    expect(bubbleDisplay(3)).toEqual({ filled: 3, overflow: null });
    expect(bubbleDisplay(5)).toEqual({ filled: 5, overflow: null });
  });

  it("shows +N past 5", () => {
    expect(bubbleDisplay(6)).toEqual({ filled: 5, overflow: "+1" });
    expect(bubbleDisplay(9)).toEqual({ filled: 5, overflow: "+4" });
  });

  it("treats negative counts as 0", () => {
    expect(bubbleDisplay(-2)).toEqual({ filled: 0, overflow: null });
  });
});
