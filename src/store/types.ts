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
}

export interface ProcessStep {
  title: string
  description: string
}

export interface ProcessContent {
  type: 'process'
  heading: string
  steps: ProcessStep[]
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
  heading: string
  stats: MetricStat[]
}

export interface QuoteContent {
  type: 'quote'
  quote: string
  attribution: string
  role: string
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
  /** Steps above baseline for heading sizes (2xl–6xl). 0 = default. */
  headingSizeStep?: number
  /** Steps above baseline for body copy sizes (xs–xl). 0 = default. */
  bodySizeStep?: number
  /** Per-slide body-text column width override (1920-space px). undefined = template default. */
  bodyWidth?: number
}

/** A deck is one presentation/document. Each deck owns its slides;
 *  brand/theme settings are shared globally across all decks. */
export interface Deck {
  id: string
  name: string
  slides: Slide[]
  selectedSlideId: string | null
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

