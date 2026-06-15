export type SlideType =
  | 'hero'
  | 'about'
  | 'section-title'
  | 'cv'
  | 'work-history'
  | 'case-study'
  | 'bento'
  | 'sign-off'
  // ── Case-study presentation templates ──
  | 'cover'
  | 'problem'
  | 'process'
  | 'showcase'
  | 'before-after'
  | 'metrics'
  | 'quote'
  | 'columns'

export interface HeroContent {
  type: 'hero'
  title: string
  subtitle: string
  name: string
  role: string
  backgroundImage: string
}

export interface AboutContent {
  type: 'about'
  heading: string
  paragraphs: string[]
  image: string
  name: string
  role: string
}

export interface SectionTitleContent {
  type: 'section-title'
  heading: string
  blurb?: string
  showBlurb?: boolean
  ctaLabel?: string
  ctaUrl?: string
  showCta?: boolean
  backgroundImage: string
}

export interface CVContent {
  type: 'cv'
  company: string
  logo: string
  roleBadge: string
  dateRange: string
  roleType: string
  description: string
  bullets: string[]
  image: string
  backgroundImage: string
}

export interface WorkHistoryEntry {
  company: string
  role: string
  dateRange: string
}

export interface WorkHistoryContent {
  type: 'work-history'
  heading: string
  entries: WorkHistoryEntry[]
}

export interface CaseStudyContent {
  type: 'case-study'
  number: string
  heading: string
  description: string
  linkText: string
  linkUrl: string
  images: string[]
  backgroundImage: string
}

export interface BentoItem {
  image: string
  description: string
}

export interface BentoContent {
  type: 'bento'
  items: BentoItem[]
  /** Image count (1–4) in new system; was flat layout index (0–6) in old system */
  layoutVariant: number
  showBlurbs: boolean
  /** Migration flag — set after converting old layoutVariant to new system */
  _bentoMigrated?: boolean
}

export interface SignOffContent {
  type: 'sign-off'
  heading: string
  subheading: string
  email: string
  links: { label: string; url: string }[]
  backgroundImage: string
}

// ── Case-study presentation templates ──

export interface CoverContent {
  type: 'cover'
  eyebrow: string
  projectName: string
  client: string
  role: string
  year: string
  backgroundImage: string
}

export interface ProblemContent {
  type: 'problem'
  label: string       // small uppercase eyebrow, e.g. "THE CHALLENGE"
  statement: string   // large headline framing of the problem
  context: string     // supporting paragraph
  backgroundImage: string
}

export interface ProcessStep {
  title: string
  description: string
}

export interface ProcessContent {
  type: 'process'
  eyebrow: string
  heading: string
  steps: ProcessStep[]
  backgroundImage: string
}

export interface ShowcaseContent {
  type: 'showcase'
  image: string
  caption: string
}

export interface BeforeAfterContent {
  type: 'before-after'
  heading: string
  beforeImage: string
  afterImage: string
  beforeLabel: string
  afterLabel: string
}

export interface MetricStat {
  value: string   // e.g. "+38%"
  label: string   // e.g. "Conversion rate"
}

export interface MetricsContent {
  type: 'metrics'
  eyebrow: string
  heading: string
  stats: MetricStat[]
  backgroundImage: string
}

export interface QuoteContent {
  type: 'quote'
  quote: string
  attribution: string
  role: string
  backgroundImage: string
}

export interface ColumnItem {
  title: string
  body: string
}

export interface ColumnsContent {
  type: 'columns'
  heading: string
  columns: ColumnItem[]
  rows: number          // 1 = single row, 2 = grid of two rows
  backgroundImage: string
}

export type SlideContent =
  | HeroContent
  | AboutContent
  | SectionTitleContent
  | CVContent
  | WorkHistoryContent
  | CaseStudyContent
  | BentoContent
  | SignOffContent
  | CoverContent
  | ProblemContent
  | ProcessContent
  | ShowcaseContent
  | BeforeAfterContent
  | MetricsContent
  | QuoteContent
  | ColumnsContent

export interface DrawingPath {
  d: string              // SVG path data
  stroke: string         // semantic: 'text' | 'background' | 'accent'
  strokeWidth: number
  opacity: number
}

export interface DrawingLayer {
  id: string
  paths: DrawingPath[]
  visible: boolean
  name: string
  rotation: number       // degrees, 0-360
  scale: number          // uniform scale (0.1-5.0)
  scaleX?: number        // non-uniform X scale (shift+drag)
  scaleY?: number        // non-uniform Y scale (shift+drag)
  offsetX: number        // px translation
  offsetY: number        // px translation
  opacity?: number       // 0-1, defaults to 1
  groupId?: string       // if set, this layer belongs to a group
  // ── Image layers ── when `image` is set, this layer is a placed image
  // (instead of vector paths). The same transform fields above apply.
  image?: string         // data URL or /data/images path
  imageW?: number        // base width in slide px (at scale 1)
  imageH?: number        // base height in slide px (at scale 1)
  radius?: number        // corner radius in px (0 = square)
}

export interface DrawingGroup {
  id: string
  name: string
  visible: boolean
}

export interface Slide {
  id: string
  type: SlideType
  content: SlideContent
  styleVariant: number
  darkMode: boolean
  drawingLayers: DrawingLayer[]
  drawingGroups: DrawingGroup[]
  /** Steps for the main slide title size (decoupled from in-content headings). 0 = default. */
  titleSizeStep?: number
  /** Steps above baseline for in-content heading sizes (column/step titles, etc.). 0 = default. */
  headingSizeStep?: number
  /** Steps above baseline for body copy sizes (xs–xl). 0 = default. */
  bodySizeStep?: number
  /** Per-slide body-text column width override (1920-space px). undefined = template default. */
  bodyWidth?: number
}

/** Per-deck brand/theme settings (fonts, palette, spacing, texture, footer,
 *  background library). Each deck carries its own. */
export interface DeckSettings {
  colorPaletteId: string
  headerFont: string
  bodyFont: string
  footerName: string
  footerTitle: string
  footerShowYear: boolean
  headerUppercase: boolean
  headerLetterSpacing: number
  slidePadding: number
  slideRounding: number
  backgroundLibrary: string[]
  textureImage: string
  textureBlendMode: string
  textureOpacity: number
}

/** A deck is one presentation/document. Each deck owns its slides AND its
 *  settings; the top-level store fields mirror the active deck's. */
export interface Deck {
  id: string
  name: string
  slides: Slide[]
  selectedSlideId: string | null
  settings?: DeckSettings
}

export interface ImageTransform {
  x: number // percentage offset from center (-50 to 50)
  y: number // percentage offset from center (-50 to 50)
  zoom: number // 1 = fit, 1.5 = 150%, etc.
}

export interface FontOption {
  name: string
  family: string
}

