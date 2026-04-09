"use client";

import { useMemo } from "react";
import { Group, Text } from "react-konva";
import type { TextSegment } from "../lib/rich-text-parser";

interface RichContentRendererProps {
  segments: TextSegment[];
  x: number;
  y: number;
  width: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  normalColor?: string;
  highlightColor?: string;
}

type PositionedWord = {
  text: string;
  x: number;
  y: number;
  highlighted: boolean;
};

// Shared offscreen canvas for text measurement
let measureCanvas: HTMLCanvasElement | null = null;
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCanvas) {
    measureCanvas = document.createElement("canvas");
  }
  return measureCanvas.getContext("2d")!;
}

function measureWord(
  word: string,
  fontSize: number,
  fontFamily: string,
): number {
  const ctx = getMeasureCtx();
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText(word).width;
}

type TaggedWord = {
  text: string;
  highlighted: boolean;
  isLineBreak: boolean;
};

function tokenize(segments: TextSegment[]): TaggedWord[] {
  const words: TaggedWord[] = [];

  for (const segment of segments) {
    if (!segment.text) continue;

    // Split by newlines first, then by spaces
    const lines = segment.text.split("\n");
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      if (lineIdx > 0) {
        words.push({
          text: "",
          highlighted: segment.highlighted,
          isLineBreak: true,
        });
      }
      const lineWords = lines[lineIdx].split(/(\s+)/);
      for (const w of lineWords) {
        if (w === "") continue;
        words.push({
          text: w,
          highlighted: segment.highlighted,
          isLineBreak: false,
        });
      }
    }
  }

  return words;
}

function layoutWords(
  words: TaggedWord[],
  width: number,
  fontSize: number,
  lineHeight: number,
  fontFamily: string,
): { positioned: PositionedWord[]; totalHeight: number } {
  const positioned: PositionedWord[] = [];
  const lineHeightPx = fontSize * lineHeight;

  let curX = 0;
  let curLine = 0;

  for (const word of words) {
    if (word.isLineBreak) {
      curLine++;
      curX = 0;
      continue;
    }

    // Whitespace-only tokens: just advance x
    if (/^\s+$/.test(word.text)) {
      const spaceW = measureWord(word.text, fontSize, fontFamily);
      curX += spaceW;
      continue;
    }

    const wordW = measureWord(word.text, fontSize, fontFamily);

    // Wrap if this word exceeds the line width (but not if we're at position 0)
    if (curX > 0 && curX + wordW > width) {
      curLine++;
      curX = 0;
    }

    positioned.push({
      text: word.text,
      x: curX,
      y: curLine * lineHeightPx,
      highlighted: word.highlighted,
    });

    curX += wordW;
  }

  const totalHeight = (curLine + 1) * lineHeightPx;
  return { positioned, totalHeight };
}

/**
 * Compute the rendered height of segments without rendering.
 * Used by ContentSlide for synchronous auto-sizing.
 */
export function computeTextHeight(
  segments: TextSegment[],
  width: number,
  fontSize: number,
  lineHeight: number,
  fontFamily: string,
): number {
  const words = tokenize(segments);
  const { totalHeight } = layoutWords(
    words,
    width,
    fontSize,
    lineHeight,
    fontFamily,
  );
  return totalHeight;
}

export default function RichContentRenderer({
  segments,
  x,
  y,
  width,
  fontSize,
  lineHeight,
  fontFamily,
  normalColor = "white",
  highlightColor = "#ffd9af",
}: RichContentRendererProps) {
  const { positioned } = useMemo(() => {
    const words = tokenize(segments);
    return layoutWords(words, width, fontSize, lineHeight, fontFamily);
  }, [segments, width, fontSize, lineHeight, fontFamily]);

  return (
    <Group x={x} y={y}>
      {positioned.map((word, i) => (
        <Text
          key={i}
          text={word.text}
          x={word.x}
          y={word.y}
          fill={word.highlighted ? highlightColor : normalColor}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />
      ))}
    </Group>
  );
}
