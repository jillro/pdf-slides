import { describe, it, expect } from "vitest";
import {
  decodeHtmlEntities,
  stripHtmlTags,
  htmlToPlainText,
  parseWordPressUrl,
  RUBRIQUE_MAPPING,
} from "./wordpress-utils";

describe("decodeHtmlEntities", () => {
  it("decodes decimal numeric entities", () => {
    expect(decodeHtmlEntities("caf&#233;")).toBe("café");
  });

  it("decodes hexadecimal numeric entities", () => {
    expect(decodeHtmlEntities("caf&#xE9;")).toBe("café");
  });

  it("decodes named entities", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry")).toBe("Tom & Jerry");
    expect(decodeHtmlEntities("caf&eacute;")).toBe("café");
  });

  it("leaves unknown named entities verbatim", () => {
    expect(decodeHtmlEntities("a &foo; b")).toBe("a &foo; b");
  });
});

describe("stripHtmlTags", () => {
  it("removes tags, decodes entities and trims", () => {
    expect(stripHtmlTags("  <p>Tom &amp; <b>Jerry</b></p>  ")).toBe(
      "Tom & Jerry",
    );
  });
});

describe("htmlToPlainText", () => {
  it("turns paragraph breaks into a blank line", () => {
    expect(htmlToPlainText("<p>one</p><p>two</p>")).toBe("one\n\ntwo");
  });

  it("turns <br> into a newline", () => {
    expect(htmlToPlainText("one<br>two")).toBe("one\ntwo");
  });

  it("collapses three or more newlines into two", () => {
    expect(htmlToPlainText("one<br><br><br><br>two")).toBe("one\n\ntwo");
  });
});

describe("parseWordPressUrl", () => {
  it("parses a valid URL into domain and slug", () => {
    expect(parseWordPressUrl("https://example.com/blog/my-post")).toEqual({
      domain: "https://example.com",
      slug: "my-post",
    });
  });

  it("handles a trailing slash", () => {
    expect(parseWordPressUrl("https://example.com/blog/my-post/")).toEqual({
      domain: "https://example.com",
      slug: "my-post",
    });
  });

  it("returns null for a non-URL string", () => {
    expect(parseWordPressUrl("not a url")).toBeNull();
  });

  it("returns null for a URL with an empty path", () => {
    expect(parseWordPressUrl("https://example.com")).toBeNull();
  });
});

describe("RUBRIQUE_MAPPING", () => {
  it("maps WordPress slugs to app rubriques", () => {
    expect(RUBRIQUE_MAPPING.edito).toBe("édito");
    expect(RUBRIQUE_MAPPING["au-cas-ou"]).toBe("au cas où");
  });
});
