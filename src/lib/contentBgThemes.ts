import altBg1 from "../assets/alt_bg1.png";
import altBg2 from "../assets/alt_bg2.png";
import {
  NEAR_WHITE,
  ACCENT,
  DARK_HIGHLIGHT,
  DARK_TEXT,
  ALT_ACCENT,
} from "./colors";

export type ContentBgThemeId = "blurred" | "alt_bg1" | "alt_bg2";

export type ContentBgTheme = {
  id: ContentBgThemeId;
  label: string;
  src: string | null;
  textColor: string;
  boldColor: string;
  bgHighlightColor: string;
  accentColor: string;
  fontWeight: string;
  drawOverlay: boolean;
};

export const CONTENT_BG_THEMES: Record<ContentBgThemeId, ContentBgTheme> = {
  blurred: {
    id: "blurred",
    label: "Image floutée",
    src: null,
    textColor: NEAR_WHITE,
    boldColor: ACCENT,
    bgHighlightColor: DARK_HIGHLIGHT,
    accentColor: ACCENT,
    fontWeight: "500",
    drawOverlay: true,
  },
  alt_bg1: {
    id: "alt_bg1",
    label: "Fond clair",
    src: altBg1.src,
    textColor: DARK_TEXT,
    boldColor: DARK_TEXT,
    bgHighlightColor: NEAR_WHITE,
    accentColor: ALT_ACCENT,
    fontWeight: "normal",
    drawOverlay: false,
  },
  alt_bg2: {
    id: "alt_bg2",
    label: "Fond alt 2",
    src: altBg2.src,
    textColor: NEAR_WHITE,
    boldColor: ACCENT,
    bgHighlightColor: DARK_HIGHLIGHT,
    accentColor: ACCENT,
    fontWeight: "500",
    drawOverlay: false,
  },
};

export const DEFAULT_CONTENT_BG_THEME: ContentBgThemeId = "blurred";

export const CONTENT_BG_THEME_IDS: ContentBgThemeId[] = [
  "blurred",
  "alt_bg1",
  "alt_bg2",
];
