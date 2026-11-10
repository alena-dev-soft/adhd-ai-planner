import { describe, expect, it } from "vitest";
import { overload, totalTarget } from "./overload";

describe("overload", () => {
  it("is 'yes' up to 12", () => {
    expect(overload([])).toBe("yes");
    expect(overload([4, 4, 4])).toBe("yes");
  });

  it("is 'warning' above 12 up to 15", () => {
    expect(overload([8, 5])).toBe("warning");
    expect(overload([8, 4, 3])).toBe("warning");
  });

  it("is 'no' above 15", () => {
    expect(overload([8, 8])).toBe("no");
  });

  it("ignores null targets", () => {
    expect(overload([null, 8, undefined, 5, null])).toBe("warning");
    expect(overload([null, null])).toBe("yes");
    expect(totalTarget([null, 3, undefined, 2])).toBe(5);
  });
});
