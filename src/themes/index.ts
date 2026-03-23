import type { FontOption } from '../store/types'

export const ALL_HEADER_FONTS: FontOption[] = [
  { name: 'Archivo', family: "'Archivo Variable', sans-serif" },
  { name: 'Inter', family: "'Inter Variable', sans-serif" },
  { name: 'Space Grotesk', family: "'Space Grotesk Variable', sans-serif" },
  { name: 'DM Sans', family: "'DM Sans Variable', sans-serif" },
  { name: 'Cormorant', family: "'Cormorant Variable', serif" },
  { name: 'Playfair Display', family: "'Playfair Display Variable', serif" },
  { name: 'Source Serif 4', family: "'Source Serif 4 Variable', serif" },
  { name: 'Fraunces', family: "'Fraunces Variable', serif" },
  { name: 'Lora', family: "'Lora Variable', serif" },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif" },
  { name: 'Oswald', family: "'Oswald Variable', sans-serif" },
  { name: 'Anton', family: "'Anton', sans-serif" },
  { name: 'Righteous', family: "'Righteous', sans-serif" },
  { name: 'Quicksand', family: "'Quicksand Variable', sans-serif" },
  { name: 'Comfortaa', family: "'Comfortaa Variable', sans-serif" },
  { name: 'Orbitron', family: "'Orbitron Variable', sans-serif" },
]

export const ALL_BODY_FONTS: FontOption[] = [
  { name: 'Inter', family: "'Inter Variable', sans-serif" },
  { name: 'DM Sans', family: "'DM Sans Variable', sans-serif" },
  { name: 'Source Serif 4', family: "'Source Serif 4 Variable', serif" },
  { name: 'Archivo', family: "'Archivo Variable', sans-serif" },
  { name: 'Work Sans', family: "'Work Sans Variable', sans-serif" },
  { name: 'Karla', family: "'Karla Variable', sans-serif" },
  { name: 'Lora', family: "'Lora Variable', serif" },
  { name: 'Roboto', family: "'Roboto Variable', sans-serif" },
  { name: 'Outfit', family: "'Outfit Variable', sans-serif" },
  { name: 'Barlow', family: "'Barlow', sans-serif" },
  { name: 'Nunito', family: "'Nunito Variable', sans-serif" },
  { name: 'Poppins', family: "'Poppins', sans-serif" },
  { name: 'Space Mono', family: "'Space Mono', monospace" },
  { name: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace" },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
  { name: 'Fira Code', family: "'Fira Code Variable', monospace" },
]

// --- Color Palettes ---

export interface ColorPalette {
  id: string
  name: string
  swatch: string // preview color for the picker
  light: {
    background: string
    surface: string
    surfaceAlt: string
    primary: string
    secondary: string
    accent: string
    text: string
    textMuted: string
    textOnDark: string
    border: string
    cardDark: string
    cardDarkText: string
    badge: string
    badgeText: string
  }
  dark: {
    background: string
    surface: string
    surfaceAlt: string
    primary: string
    secondary: string
    accent: string
    text: string
    textMuted: string
    textOnDark: string
    border: string
    cardDark: string
    cardDarkText: string
    badge: string
    badgeText: string
  }
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'mono',
    name: 'Mono',
    swatch: '#1a1a1a',
    light: {
      background: '#f2f2f2', surface: '#ffffff', surfaceAlt: '#e8e8e8',
      primary: '#1a1a1a', secondary: '#666666', accent: '#1a1a1a',
      text: '#1a1a1a', textMuted: '#888888', textOnDark: '#f2f2f2',
      border: '#d0d0d0', cardDark: '#1a1a1a', cardDarkText: '#f2f2f2',
      badge: '#e8e8e8', badgeText: '#1a1a1a',
    },
    dark: {
      background: '#111111', surface: '#1c1c1c', surfaceAlt: '#282828',
      primary: '#ffffff', secondary: '#aaaaaa', accent: '#ffffff',
      text: '#e8e8e8', textMuted: '#777777', textOnDark: '#111111',
      border: '#333333', cardDark: '#282828', cardDarkText: '#e8e8e8',
      badge: '#333333', badgeText: '#e8e8e8',
    },
  },
  {
    id: 'blue',
    name: 'Blue',
    swatch: '#2563eb',
    light: {
      background: '#f0f4fa', surface: '#ffffff', surfaceAlt: '#e0e8f4',
      primary: '#1e40af', secondary: '#6484b8', accent: '#2563eb',
      text: '#0f172a', textMuted: '#6482a0', textOnDark: '#f0f4fa',
      border: '#c8d4e8', cardDark: '#0f172a', cardDarkText: '#f0f4fa',
      badge: '#dbeafe', badgeText: '#1e40af',
    },
    dark: {
      background: '#0c1222', surface: '#152038', surfaceAlt: '#1e2e50',
      primary: '#60a5fa', secondary: '#7090b8', accent: '#3b82f6',
      text: '#e2e8f0', textMuted: '#6882a0', textOnDark: '#0c1222',
      border: '#253552', cardDark: '#1e2e50', cardDarkText: '#e2e8f0',
      badge: '#253552', badgeText: '#60a5fa',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    swatch: '#475569',
    light: {
      background: '#f1f5f9', surface: '#ffffff', surfaceAlt: '#e2e8f0',
      primary: '#1e293b', secondary: '#64748b', accent: '#475569',
      text: '#0f172a', textMuted: '#64748b', textOnDark: '#f1f5f9',
      border: '#cbd5e1', cardDark: '#1e293b', cardDarkText: '#f1f5f9',
      badge: '#e2e8f0', badgeText: '#334155',
    },
    dark: {
      background: '#0f172a', surface: '#1e293b', surfaceAlt: '#334155',
      primary: '#cbd5e1', secondary: '#94a3b8', accent: '#94a3b8',
      text: '#e2e8f0', textMuted: '#64748b', textOnDark: '#0f172a',
      border: '#334155', cardDark: '#334155', cardDarkText: '#e2e8f0',
      badge: '#334155', badgeText: '#cbd5e1',
    },
  },
  {
    id: 'green',
    name: 'Green',
    swatch: '#16a34a',
    light: {
      background: '#f0faf4', surface: '#ffffff', surfaceAlt: '#e0f4e8',
      primary: '#166534', secondary: '#64b884', accent: '#16a34a',
      text: '#0a1a10', textMuted: '#64a080', textOnDark: '#f0faf4',
      border: '#c8e8d4', cardDark: '#0a1a10', cardDarkText: '#f0faf4',
      badge: '#dcfce7', badgeText: '#166534',
    },
    dark: {
      background: '#0c1a12', surface: '#142820', surfaceAlt: '#1e382c',
      primary: '#86efac', secondary: '#70b888', accent: '#22c55e',
      text: '#e2f0e8', textMuted: '#68a080', textOnDark: '#0c1a12',
      border: '#253f30', cardDark: '#1e382c', cardDarkText: '#e2f0e8',
      badge: '#253f30', badgeText: '#86efac',
    },
  },
  {
    id: 'plum',
    name: 'Plum',
    swatch: '#7c3aed',
    light: {
      background: '#f5f3ff', surface: '#ffffff', surfaceAlt: '#ede9fe',
      primary: '#5b21b6', secondary: '#8b5cf6', accent: '#7c3aed',
      text: '#1e1033', textMuted: '#7c6f96', textOnDark: '#f5f3ff',
      border: '#ddd6fe', cardDark: '#1e1033', cardDarkText: '#f5f3ff',
      badge: '#ede9fe', badgeText: '#5b21b6',
    },
    dark: {
      background: '#110e1f', surface: '#1c1730', surfaceAlt: '#2a2244',
      primary: '#c4b5fd', secondary: '#8b7fb8', accent: '#8b5cf6',
      text: '#e8e4f0', textMuted: '#7b7394', textOnDark: '#110e1f',
      border: '#352d52', cardDark: '#2a2244', cardDarkText: '#e8e4f0',
      badge: '#352d52', badgeText: '#c4b5fd',
    },
  },
  {
    id: 'sand',
    name: 'Sand',
    swatch: '#a68a64',
    light: {
      background: '#f7f4f0', surface: '#ffffff', surfaceAlt: '#eee8df',
      primary: '#44382a', secondary: '#8a7e6e', accent: '#a68a64',
      text: '#2c2418', textMuted: '#8a8070', textOnDark: '#f7f4f0',
      border: '#ddd4c8', cardDark: '#2c2418', cardDarkText: '#f7f4f0',
      badge: '#eee8df', badgeText: '#5c4e3c',
    },
    dark: {
      background: '#181510', surface: '#242018', surfaceAlt: '#322c22',
      primary: '#d4c4a8', secondary: '#a09480', accent: '#c8a878',
      text: '#e8e2d8', textMuted: '#8a8070', textOnDark: '#181510',
      border: '#3e3628', cardDark: '#322c22', cardDarkText: '#e8e2d8',
      badge: '#3e3628', badgeText: '#d4c4a8',
    },
  },
]

export const paletteMap: Record<string, ColorPalette> = Object.fromEntries(
  COLOR_PALETTES.map((p) => [p.id, p])
)

export function applyPalette(
  paletteId: string,
  headerFont: string,
  bodyFont: string,
  darkMode: boolean = false,
  slideRounding: number = 6,
  slidePadding: number = 0,
  headerUppercase: boolean = false,
  headerLetterSpacing: number = 0,
) {
  const palette = paletteMap[paletteId] ?? COLOR_PALETTES[0]
  const c = darkMode ? palette.dark : palette.light
  const root = document.documentElement

  root.style.setProperty('--color-background', c.background)
  root.style.setProperty('--color-surface', c.surface)
  root.style.setProperty('--color-surface-alt', c.surfaceAlt)
  root.style.setProperty('--color-primary', c.primary)
  root.style.setProperty('--color-secondary', c.secondary)
  root.style.setProperty('--color-accent', c.accent)
  root.style.setProperty('--color-text', c.text)
  root.style.setProperty('--color-text-muted', c.textMuted)
  root.style.setProperty('--color-text-on-dark', c.textOnDark)
  root.style.setProperty('--color-border', c.border)
  root.style.setProperty('--color-card-dark', c.cardDark)
  root.style.setProperty('--color-card-dark-text', c.cardDarkText)
  root.style.setProperty('--color-badge', c.badge)
  root.style.setProperty('--color-badge-text', c.badgeText)

  root.style.setProperty('--font-header', headerFont)
  root.style.setProperty('--font-body', bodyFont)
  root.style.setProperty('--border-radius', `${slideRounding}px`)
  root.style.setProperty('--slide-border-radius', '8px')
  root.style.setProperty('--slide-padding', `${Math.max(slidePadding, 14)}px`)
  root.style.setProperty('--header-text-transform', headerUppercase ? 'uppercase' : 'none')
  // Clamp letter spacing — migrates old px values (e.g. -5..5) to em range
  const clampedLS = Math.abs(headerLetterSpacing) > 0.5 ? 0 : Math.max(-0.05, Math.min(0.1, headerLetterSpacing))
  root.style.setProperty('--header-letter-spacing', `${clampedLS}em`)
}
