const NBSP = "\u00A0"; // non-breaking space
const NNBSP = "\u202F"; // narrow non-breaking space

/**
 * Apply French typographic rules for non-breaking spaces.
 *
 * - Before `:` — replace existing regular space with NBSP
 * - Before `;` `?` `!` — replace existing regular space with NNBSP
 * - Before `%` — replace existing regular space with NBSP
 * - After `«` — ensure NBSP (inserted if missing)
 * - Before `»` — ensure NBSP (inserted if missing)
 *
 * Only existing spaces are converted for `:;?!%` (avoids breaking URLs or times).
 * Guillemets always get a non-breaking space even if none exists.
 * Idempotent: safe to apply multiple times.
 */
export function applyFrenchTypography(text: string): string {
  return (
    text
      // Before : — convert any whitespace (regular, NBSP, NNBSP) to NBSP
      .replace(/[\s\u00A0\u202F]:/g, `${NBSP}:`)
      // Before ; ? ! — convert any whitespace to NNBSP
      .replace(/[\s\u00A0\u202F]([;?!])/g, `${NNBSP}$1`)
      // Before % — convert any whitespace to NBSP
      .replace(/[\s\u00A0\u202F]%/g, `${NBSP}%`)
      // After « — ensure NBSP (replace existing space or insert)
      .replace(/«[\s\u00A0\u202F]?/g, `«${NBSP}`)
      // Before » — ensure NBSP (replace existing space or insert)
      .replace(/[\s\u00A0\u202F]?»/g, `${NBSP}»`)
  );
}
