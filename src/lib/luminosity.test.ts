import { describe, it, expect } from "vitest";
import { calculateOverlayOpacity } from "./luminosity";

describe("calculateOverlayOpacity", () => {
  it("returns the minimum opacity for full darkness", () => {
    expect(calculateOverlayOpacity(0)).toBe(0.5);
  });

  it("returns the maximum opacity for full lightness", () => {
    expect(calculateOverlayOpacity(1)).toBe(0.8);
  });

  it("clamps luminosity below 0 to the minimum opacity", () => {
    expect(calculateOverlayOpacity(-1)).toBe(0.5);
  });

  it("clamps luminosity above 1 to the maximum opacity", () => {
    expect(calculateOverlayOpacity(2)).toBe(0.8);
  });

  it("respects custom min and max opacities", () => {
    expect(calculateOverlayOpacity(0, 0.2, 1)).toBe(0.2);
    expect(calculateOverlayOpacity(1, 0.2, 1)).toBe(1);
  });

  it("interpolates linearly at the midpoint", () => {
    expect(calculateOverlayOpacity(0.5)).toBeCloseTo(0.65);
  });
});
