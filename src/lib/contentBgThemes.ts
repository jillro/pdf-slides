import altBg1 from "../assets/alt_bg1.png";
import altBg2 from "../assets/alt_bg2.png";

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
    textColor: "white",
    boldColor: "#ffd9af",
    bgHighlightColor: "#1C1C1C",
    accentColor: "#ffd9af",
    fontWeight: "500",
    drawOverlay: true,
  },
  alt_bg1: {
    id: "alt_bg1",
    label: "Fond clair",
    src: altBg1.src,
    textColor: "#313131",
    boldColor: "#313131",
    bgHighlightColor: "#FFFFFF",
    accentColor: "#E19B4C",
    fontWeight: "normal",
    drawOverlay: false,
  },
  alt_bg2: {
    id: "alt_bg2",
    label: "Fond alt 2",
    src: altBg2.src,
    textColor: "white",
    boldColor: "#ffd9af",
    bgHighlightColor: "#1C1C1C",
    accentColor: "#ffd9af",
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
