import type { SlideType } from '../store/types'

/**
 * Body-text column width control.
 *
 * Each slide can override its body column width (slide.bodyWidth, in 1920-space
 * px) via the canvas drag handle or the Page-panel slider. When unset, the
 * template/variant default below is used.
 */

export const BODY_WIDTH_MIN = 320
export const BODY_WIDTH_MAX = 1720

// Per template-type, per styleVariant (A/B/C/D) default body-column width.
// Mirrors the literals the templates previously hard-coded.
const DEFAULTS: Partial<Record<SlideType, number[]>> = {
  about: [900, 560, 880, 760],
  problem: [720, 720, 680, 640],
  quote: [1300, 1500, 1250, 1100],
}

/** Does this slide type expose the body-width control? */
export function supportsBodyWidth(type: SlideType): boolean {
  return type in DEFAULTS
}

/** Default body-column width for a type+variant (1920-space px). */
export function defaultBodyWidth(type: SlideType, variant: number): number {
  const arr = DEFAULTS[type]
  return (arr && arr[variant]) ?? 760
}
