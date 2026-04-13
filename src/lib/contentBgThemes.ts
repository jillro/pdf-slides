import altBg1 from "../assets/alt_bg1.png";
import altBg2 from "../assets/alt_bg2.png";

export type ContentBgThemeId = "blurred" | "alt_bg1" | "alt_bg2";

export type ContentBgTheme = {
  id: ContentBgThemeId;
  label: string;
  src: string | null;
  textColor: string;
  highlightColor: string;
  highlightBold: boolean;
  accentColor: string;
  drawOverlay: boolean;
};

export const CONTENT_BG_THEMES: Record<ContentBgThemeId, ContentBgTheme> = {
  blurred: {
    id: "blurred",
    label: "Image floutée",
    src: null,
    textColor: "white",
    highlightColor: "#ffd9af",
    highlightBold: false,
    accentColor: "#ffd9af",
    drawOverlay: true,
  },
  alt_bg1: {
    id: "alt_bg1",
    label: "Fond clair",
    src: altBg1.src,
    textColor: "#313131",
    highlightColor: "#313131",
    highlightBold: true,
    accentColor: "#E19B4C",
    drawOverlay: false,
  },
  alt_bg2: {
    id: "alt_bg2",
    label: "Fond alt 2",
    src: altBg2.src,
    textColor: "white",
    highlightColor: "#ffd9af",
    highlightBold: false,
    accentColor: "#ffd9af",
    drawOverlay: false,
  },
};

export const DEFAULT_CONTENT_BG_THEME: ContentBgThemeId = "blurred";

export const CONTENT_BG_THEME_IDS: ContentBgThemeId[] = [
  "blurred",
  "alt_bg1",
  "alt_bg2",
];
