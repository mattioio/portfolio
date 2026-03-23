/**
 * Centralized type scale for slide templates.
 *
 * Based on a ~1.333 (perfect fourth) ratio anchored at 18 px body copy,
 * rounded to clean values.  Every slide template imports from here instead
 * of hard-coding pixel values so the scale can be tuned in one place.
 *
 * Usage:
 *   import { TYPE } from '../../constants/typography'
 *   style={{ fontSize: TYPE.body }}
 */
export const TYPE = {
  /** 12 px — Uppercase labels, date markers, tiny metadata */
  xs: '12px',
  /** 14 px — Captions, badge text, secondary labels */
  sm: '14px',
  /** 16 px — Link pills, button text, image captions */
  base: '16px',
  /** 18 px — Standard body copy, descriptions */
  body: '18px',
  /** 20 px — Lead body text, prominent descriptions */
  lg: '20px',
  /** 24 px — Large body, subheadings, email links */
  xl: '24px',
  /** 32 px — Small display headings, timeline company names */
  '2xl': '32px',
  /** 48 px — Content headings (case study, CV company) */
  '3xl': '48px',
  /** 64 px — Section headings, mid-tier titles */
  '4xl': '64px',
  /** 80 px — Large section titles */
  '5xl': '80px',
  /** 96 px — Sign-off / section display titles */
  '6xl': '96px',
  /** 120 px — Hero titles, about headings */
  '7xl': '120px',
  /** 160 px — Hero display */
  '8xl': '160px',
  /** 260 px — Oversized bleed hero */
  '9xl': '260px',
} as const

export type TypeToken = keyof typeof TYPE

/** Ordered scale keys for stepping through sizes */
const SCALE_KEYS: TypeToken[] = [
  'xs', 'sm', 'base', 'body', 'lg', 'xl',
  '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl',
]

/**
 * Shift a TYPE token by `step` positions on the scale, clamping at boundaries.
 *
 *   stepType('body', 0)  → '18px'  (no change)
 *   stepType('body', 1)  → '20px'  (one step up → lg)
 *   stepType('body', 2)  → '24px'  (two steps up → xl)
 */
export function stepType(token: TypeToken, step: number): string {
  if (step === 0) return TYPE[token]
  const idx = SCALE_KEYS.indexOf(token)
  if (idx === -1) return TYPE[token]
  const newIdx = Math.max(0, Math.min(SCALE_KEYS.length - 1, idx + step))
  return TYPE[SCALE_KEYS[newIdx]]
}
