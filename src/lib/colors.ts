// Shared color constants following "safe rules" design principles:
// - Near-black/near-white instead of pure black/white
// - Saturated (warm-tinted) neutrals to match the peach accent palette

export const NEAR_WHITE = "#F5F0EB";
export const ACCENT = "#ffd9af";

// Warm-tinted near-blacks for overlays and backgrounds
export const OVERLAY_COLOR = "20,18,15"; // use as rgba(${OVERLAY_COLOR},opacity)
export const GRADIENT_COLOR = "15,13,10"; // use as rgba(${GRADIENT_COLOR},opacity)

// Saturated neutral variants
export const DARK_HIGHLIGHT = "#1E1B16"; // warm-tinted replacement for #1C1C1C
export const DARK_TEXT = "#332F29"; // warm-tinted replacement for #313131

// Alt theme accent
export const ALT_ACCENT = "#E19B4C";
