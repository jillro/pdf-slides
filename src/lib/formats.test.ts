import { describe, it, expect } from "vitest";
import { FORMAT_DIMENSIONS, MAX_FORMAT_HEIGHT } from "./formats";

describe("FORMAT_DIMENSIONS", () => {
  it("defines the post dimensions", () => {
    expect(FORMAT_DIMENSIONS.post).toEqual({ width: 1080, height: 1350 });
  });

  it("defines the story dimensions", () => {
    expect(FORMAT_DIMENSIONS.story).toEqual({ width: 1080, height: 1920 });
  });
});

describe("MAX_FORMAT_HEIGHT", () => {
  it("is the tallest format height", () => {
    expect(MAX_FORMAT_HEIGHT).toBe(1920);
  });
});
