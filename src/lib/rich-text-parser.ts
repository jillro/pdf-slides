export type TextSegment = {
  text: string;
  highlighted: boolean;
};

/**
 * Parse ==highlight== markers from content string.
 * Alternates between normal and highlighted segments.
 * Unclosed trailing == is treated as literal text.
 */
export function parseHighlights(content: string): TextSegment[] {
  const parts = content.split("==");
  const segments: TextSegment[] = [];

  // Odd number of parts means last == is unclosed
  const hasUnclosed = parts.length > 1 && parts.length % 2 === 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "") continue;

    // If unclosed, rejoin the last two parts with the literal ==
    if (hasUnclosed && i === parts.length - 2) {
      segments.push({
        text: parts[i] + "==" + parts[i + 1],
        highlighted: i % 2 === 1,
      });
      break;
    }

    segments.push({
      text: parts[i],
      highlighted: i % 2 === 1,
    });
  }

  return segments.length > 0 ? segments : [{ text: "", highlighted: false }];
}

/**
 * Strip ==highlight== markers, returning plain text.
 */
export function stripHighlightMarkers(content: string): string {
  return content.replace(/==/g, "");
}
