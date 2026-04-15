export type TextStyle = "normal" | "bold" | "bg";

export type TextSegment = {
  text: string;
  style: TextStyle;
};

type Marker = "**" | "==";

const STYLE_FOR_MARKER: Record<Marker, TextStyle> = {
  "**": "bold",
  "==": "bg",
};

/**
 * Parse **bold** and ==bg== markers from content.
 * Markers are mutually exclusive: while one is open, the other is literal.
 * Unclosed trailing markers are treated as literal text.
 */
export function parseRichText(content: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let buffer = "";
  let currentStyle: TextStyle = "normal";
  let openMarker: Marker | null = null;
  let i = 0;

  const flush = (style: TextStyle) => {
    if (buffer.length > 0) {
      segments.push({ text: buffer, style });
      buffer = "";
    }
  };

  while (i < content.length) {
    const two = content.slice(i, i + 2);

    if (openMarker === null && (two === "**" || two === "==")) {
      // Look ahead for a closing marker on the same kind
      const closeIdx = content.indexOf(two, i + 2);
      if (closeIdx === -1) {
        // Unclosed: rest is literal
        buffer += content.slice(i);
        i = content.length;
        break;
      }
      flush(currentStyle);
      openMarker = two;
      currentStyle = STYLE_FOR_MARKER[two];
      i += 2;
      continue;
    }

    if (openMarker !== null && two === openMarker) {
      flush(currentStyle);
      openMarker = null;
      currentStyle = "normal";
      i += 2;
      continue;
    }

    buffer += content[i];
    i++;
  }

  flush(currentStyle);

  return segments.length > 0 ? segments : [{ text: "", style: "normal" }];
}

/**
 * Strip **…** and ==…== markers, returning plain text.
 */
export function stripRichTextMarkers(content: string): string {
  return content.replace(/\*\*/g, "").replace(/==/g, "");
}
