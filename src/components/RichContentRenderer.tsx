"use client";

import { useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import type { TextSegment, TextStyle } from "../lib/rich-text-parser";
import { NEAR_WHITE, ACCENT, DARK_HIGHLIGHT } from "../lib/colors";

interface RichContentRendererProps {
  segments: TextSegment[];
  x: number;
  y: number;
  width: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  normalColor?: string;
  boldColor?: string;
  bgHighlightColor?: string;
  fontWeight?: string;
  letterSpacing?: number;
}

type PositionedWord = {
  text: string;
  x: number;
  y: number;
  width: number;
  style: TextStyle;
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
  bold: boolean,
  fontWeight: string = "500",
  letterSpacing: number = 0,
): number {
  const ctx = getMeasureCtx();
  ctx.font = `${bold ? "bold" : fontWeight} ${fontSize}px ${fontFamily}`;
  // Match Konva's _getTextWidth: measureText + letterSpacing * length
  return ctx.measureText(word).width + letterSpacing * word.length;
}

type TaggedWord = {
  text: string;
  style: TextStyle;
  isLineBreak: boolean;
};

function tokenize(segments: TextSegment[]): TaggedWord[] {
  const words: TaggedWord[] = [];

  for (const segment of segments) {
    if (!segment.text) continue;

    const lines = segment.text.split("\n");
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      if (lineIdx > 0) {
        words.push({ text: "", style: segment.style, isLineBreak: true });
      }
      const lineWords = lines[lineIdx].split(/(\s+)/);
      for (const w of lineWords) {
        if (w === "") continue;
        words.push({ text: w, style: segment.style, isLineBreak: false });
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
  fontWeight: string = "500",
  letterSpacing: number = 0,
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

    const bold = word.style === "bold";

    // Whitespace-only tokens: just advance x
    if (/^\s+$/.test(word.text)) {
      curX += measureWord(
        word.text,
        fontSize,
        fontFamily,
        bold,
        fontWeight,
        letterSpacing,
      );
      continue;
    }

    const wordW = measureWord(
      word.text,
      fontSize,
      fontFamily,
      bold,
      fontWeight,
      letterSpacing,
    );

    // Wrap if this word exceeds the line width (but not if we're at position 0)
    if (curX > 0 && curX + wordW > width) {
      curLine++;
      curX = 0;
    }

    positioned.push({
      text: word.text,
      x: curX,
      y: curLine * lineHeightPx,
      width: wordW,
      style: word.style,
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
  fontWeight: string = "500",
  letterSpacing: number = 0,
): number {
  const words = tokenize(segments);
  const { totalHeight } = layoutWords(
    words,
    width,
    fontSize,
    lineHeight,
    fontFamily,
    fontWeight,
    letterSpacing,
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
  normalColor = NEAR_WHITE,
  boldColor = ACCENT,
  bgHighlightColor = DARK_HIGHLIGHT,
  fontWeight = "500",
  letterSpacing = 0,
}: RichContentRendererProps) {
  const { positioned } = useMemo(() => {
    const words = tokenize(segments);
    return layoutWords(
      words,
      width,
      fontSize,
      lineHeight,
      fontFamily,
      fontWeight,
      letterSpacing,
    );
  }, [
    segments,
    width,
    fontSize,
    lineHeight,
    fontFamily,
    fontWeight,
    letterSpacing,
  ]);

  const bgPadX = fontSize * 0.12;
  const bgPadY = fontSize * 0.14;
  const bgRadius = fontSize * 0.08;

  return (
    <Group x={x} y={y}>
      {positioned.map((word, i) =>
        word.style === "bg" ? (
          <Rect
            key={`bg-${i}`}
            x={word.x - bgPadX}
            y={word.y - bgPadY}
            width={word.width + bgPadX * 2}
            height={fontSize + bgPadY * 2}
            fill={bgHighlightColor}
            cornerRadius={bgRadius}
          />
        ) : null,
      )}
      {positioned.map((word, i) => (
        <Text
          key={`t-${i}`}
          text={word.text}
          x={word.x}
          y={word.y}
          fill={word.style === "bold" ? boldColor : normalColor}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={word.style === "bold" ? "bold" : fontWeight}
          letterSpacing={letterSpacing}
        />
      ))}
    </Group>
  );
}
