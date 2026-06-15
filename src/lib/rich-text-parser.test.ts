import { describe, it, expect } from "vitest";
import { parseRichText } from "./rich-text-parser";

describe("parseRichText", () => {
  it("returns a single normal segment for plain text", () => {
    expect(parseRichText("hello world")).toEqual([
      { text: "hello world", style: "normal" },
    ]);
  });

  it("parses bold markers with normal text around them", () => {
    expect(parseRichText("a **b** c")).toEqual([
      { text: "a ", style: "normal" },
      { text: "b", style: "bold" },
      { text: " c", style: "normal" },
    ]);
  });

  it("parses background markers with normal text around them", () => {
    expect(parseRichText("a ==b== c")).toEqual([
      { text: "a ", style: "normal" },
      { text: "b", style: "bg" },
      { text: " c", style: "normal" },
    ]);
  });

  it("treats the other marker as literal while one is open", () => {
    expect(parseRichText("**a ==b== c**")).toEqual([
      { text: "a ==b== c", style: "bold" },
    ]);
  });

  it("treats an unclosed marker as literal text", () => {
    expect(parseRichText("a **b")).toEqual([
      { text: "a **b", style: "normal" },
    ]);
  });

  it("falls back to an empty normal segment for an empty string", () => {
    expect(parseRichText("")).toEqual([{ text: "", style: "normal" }]);
  });
});
