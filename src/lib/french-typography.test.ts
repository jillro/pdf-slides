import { describe, it, expect } from "vitest";
import { applyFrenchTypography } from "./french-typography";

const NBSP = " ";
const NNBSP = " ";

describe("applyFrenchTypography", () => {
  it("inserts a NBSP before a colon", () => {
    expect(applyFrenchTypography("mot : suite")).toBe(`mot${NBSP}: suite`);
  });

  it("inserts a NNBSP before ; ? !", () => {
    expect(applyFrenchTypography("quoi ?")).toBe(`quoi${NNBSP}?`);
    expect(applyFrenchTypography("attention !")).toBe(`attention${NNBSP}!`);
    expect(applyFrenchTypography("oui ; non")).toBe(`oui${NNBSP}; non`);
  });

  it("inserts a NBSP before a percent sign", () => {
    expect(applyFrenchTypography("50 %")).toBe(`50${NBSP}%`);
  });

  it("inserts a NBSP on both sides of guillemets even without spaces", () => {
    expect(applyFrenchTypography("«mot»")).toBe(`«${NBSP}mot${NBSP}»`);
  });

  it("replaces an existing space around guillemets without doubling it", () => {
    expect(applyFrenchTypography("« mot »")).toBe(`«${NBSP}mot${NBSP}»`);
  });

  it("is idempotent", () => {
    const input = "Voici «un test» : 50 % ; vraiment ?";
    const once = applyFrenchTypography(input);
    expect(applyFrenchTypography(once)).toBe(once);
  });

  it("leaves a colon with no preceding space untouched (URLs)", () => {
    expect(applyFrenchTypography("http://x")).toBe("http://x");
  });
});
