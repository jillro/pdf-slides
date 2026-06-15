import { describe, it, expect } from "vitest";
import { slideCount } from "./slides";

describe("slideCount", () => {
  it("counts the title slide alone for an empty post", () => {
    expect(slideCount([], false)).toBe(1);
  });

  it("counts the title slide plus one per content section", () => {
    expect(slideCount(["a", "b"], false)).toBe(3);
  });

  it("adds the subscribe-for-more slide when enabled", () => {
    expect(slideCount(["a", "b"], true)).toBe(4);
  });
});
