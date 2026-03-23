import type { BentoContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: BentoContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

interface LayoutSlot {
  gridColumn: string
  gridRow: string
  /** Recommended image dimensions at 2x for retina */
  recWidth: number
  recHeight: number
}

interface BentoLayout {
  gridTemplate: string
  gridTemplateRows: string
  slots: LayoutSlot[]
}

// Slide is 1920x1080 with 14px padding = 1892x1052 content area
// layoutVariant = image count (1–4), styleVariant = sub-layout (A–D)

const BENTO_LAYOUTS: Record<number, BentoLayout[]> = {
  // ── Bento 1: Single image ──
  1: [
    // A: Full bleed
    {
      gridTemplate: '1fr',
      gridTemplateRows: '1fr',
      slots: [{ gridColumn: '1', gridRow: '1', recWidth: 3840, recHeight: 2160 }],
    },
  ],

  // ── Bento 2: Two images ──
  2: [
    // A: 50/50 even columns
    {
      gridTemplate: '1fr 1fr',
      gridTemplateRows: '1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 1920, recHeight: 2160 },
        { gridColumn: '2', gridRow: '1', recWidth: 1920, recHeight: 2160 },
      ],
    },
    // B: 2:1 ratio (wide left)
    {
      gridTemplate: '2fr 1fr',
      gridTemplateRows: '1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 2560, recHeight: 2160 },
        { gridColumn: '2', gridRow: '1', recWidth: 1280, recHeight: 2160 },
      ],
    },
    // C: 1:2 ratio (wide right)
    {
      gridTemplate: '1fr 2fr',
      gridTemplateRows: '1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 1280, recHeight: 2160 },
        { gridColumn: '2', gridRow: '1', recWidth: 2560, recHeight: 2160 },
      ],
    },
    // D: Stacked rows (top/bottom)
    {
      gridTemplate: '1fr',
      gridTemplateRows: '1fr 1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 3840, recHeight: 1080 },
        { gridColumn: '1', gridRow: '2', recWidth: 3840, recHeight: 1080 },
      ],
    },
  ],

  // ── Bento 3: Three images ──
  3: [
    // A: 3 equal columns
    {
      gridTemplate: '1fr 1fr 1fr',
      gridTemplateRows: '1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 1240, recHeight: 2072 },
        { gridColumn: '2', gridRow: '1', recWidth: 1240, recHeight: 2072 },
        { gridColumn: '3', gridRow: '1', recWidth: 1240, recHeight: 2072 },
      ],
    },
    // B: Large left, 2 stacked right
    {
      gridTemplate: '1.6fr 1fr',
      gridTemplateRows: '1fr 1fr',
      slots: [
        { gridColumn: '1', gridRow: '1 / 3', recWidth: 2270, recHeight: 2072 },
        { gridColumn: '2', gridRow: '1', recWidth: 1420, recHeight: 1028 },
        { gridColumn: '2', gridRow: '2', recWidth: 1420, recHeight: 1028 },
      ],
    },
    // C: Wide hero top, 2 below
    {
      gridTemplate: '1fr 1fr',
      gridTemplateRows: '1.4fr 1fr',
      slots: [
        { gridColumn: '1 / 3', gridRow: '1', recWidth: 3752, recHeight: 1220 },
        { gridColumn: '1', gridRow: '2', recWidth: 1868, recHeight: 860 },
        { gridColumn: '2', gridRow: '2', recWidth: 1868, recHeight: 860 },
      ],
    },
    // D: Large right, 2 stacked left
    {
      gridTemplate: '1fr 1.6fr',
      gridTemplateRows: '1fr 1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 1420, recHeight: 1028 },
        { gridColumn: '1', gridRow: '2', recWidth: 1420, recHeight: 1028 },
        { gridColumn: '2', gridRow: '1 / 3', recWidth: 2270, recHeight: 2072 },
      ],
    },
  ],

  // ── Bento 4: Four images ──
  4: [
    // A: 2×2 equal grid
    {
      gridTemplate: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 1868, recHeight: 1028 },
        { gridColumn: '2', gridRow: '1', recWidth: 1868, recHeight: 1028 },
        { gridColumn: '1', gridRow: '2', recWidth: 1868, recHeight: 1028 },
        { gridColumn: '2', gridRow: '2', recWidth: 1868, recHeight: 1028 },
      ],
    },
    // B: Asymmetric 2×2 (large top-left)
    {
      gridTemplate: '1.6fr 1fr',
      gridTemplateRows: '1.2fr 1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 2270, recHeight: 1140 },
        { gridColumn: '2', gridRow: '1', recWidth: 1420, recHeight: 1140 },
        { gridColumn: '1', gridRow: '2', recWidth: 2270, recHeight: 940 },
        { gridColumn: '2', gridRow: '2', recWidth: 1420, recHeight: 940 },
      ],
    },
    // C: Large top, 3 equal below
    {
      gridTemplate: '1fr 1fr 1fr',
      gridTemplateRows: '1.4fr 1fr',
      slots: [
        { gridColumn: '1 / 4', gridRow: '1', recWidth: 3752, recHeight: 1220 },
        { gridColumn: '1', gridRow: '2', recWidth: 1240, recHeight: 860 },
        { gridColumn: '2', gridRow: '2', recWidth: 1240, recHeight: 860 },
        { gridColumn: '3', gridRow: '2', recWidth: 1240, recHeight: 860 },
      ],
    },
    // D: 3 equal top, large bottom
    {
      gridTemplate: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1.4fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 1240, recHeight: 860 },
        { gridColumn: '2', gridRow: '1', recWidth: 1240, recHeight: 860 },
        { gridColumn: '3', gridRow: '1', recWidth: 1240, recHeight: 860 },
        { gridColumn: '1 / 4', gridRow: '2', recWidth: 3752, recHeight: 1220 },
      ],
    },
  ],

  // ── Bento 5: Five images ──
  5: [
    // A: Large left, 4 grid right (2×2)
    {
      gridTemplate: '1.4fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      slots: [
        { gridColumn: '1', gridRow: '1 / 3', recWidth: 2060, recHeight: 2072 },
        { gridColumn: '2', gridRow: '1', recWidth: 880, recHeight: 1028 },
        { gridColumn: '3', gridRow: '1', recWidth: 880, recHeight: 1028 },
        { gridColumn: '2', gridRow: '2', recWidth: 880, recHeight: 1028 },
        { gridColumn: '3', gridRow: '2', recWidth: 880, recHeight: 1028 },
      ],
    },
    // B: Wide top, 4 equal below
    {
      gridTemplate: '1fr 1fr 1fr 1fr',
      gridTemplateRows: '1.4fr 1fr',
      slots: [
        { gridColumn: '1 / 5', gridRow: '1', recWidth: 3752, recHeight: 1220 },
        { gridColumn: '1', gridRow: '2', recWidth: 930, recHeight: 860 },
        { gridColumn: '2', gridRow: '2', recWidth: 930, recHeight: 860 },
        { gridColumn: '3', gridRow: '2', recWidth: 930, recHeight: 860 },
        { gridColumn: '4', gridRow: '2', recWidth: 930, recHeight: 860 },
      ],
    },
    // C: 3 top, 2 wide bottom
    {
      gridTemplate: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      slots: [
        { gridColumn: '1', gridRow: '1', recWidth: 1240, recHeight: 1028 },
        { gridColumn: '2', gridRow: '1', recWidth: 1240, recHeight: 1028 },
        { gridColumn: '3', gridRow: '1', recWidth: 1240, recHeight: 1028 },
        { gridColumn: '1 / 3', gridRow: '2', recWidth: 2480, recHeight: 1028 },
        { gridColumn: '3', gridRow: '2', recWidth: 1240, recHeight: 1028 },
      ],
    },
    // D: 2 wide top, 3 bottom
    {
      gridTemplate: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      slots: [
        { gridColumn: '1 / 3', gridRow: '1', recWidth: 2480, recHeight: 1028 },
        { gridColumn: '3', gridRow: '1', recWidth: 1240, recHeight: 1028 },
        { gridColumn: '1', gridRow: '2', recWidth: 1240, recHeight: 1028 },
        { gridColumn: '2', gridRow: '2', recWidth: 1240, recHeight: 1028 },
        { gridColumn: '3', gridRow: '2', recWidth: 1240, recHeight: 1028 },
      ],
    },
  ],
}

// Fallback layout
const FALLBACK_LAYOUT: BentoLayout = BENTO_LAYOUTS[1][0]

function getLayout(imageCount: number, subVariant: number): BentoLayout {
  const variants = BENTO_LAYOUTS[imageCount]
  if (!variants) return FALLBACK_LAYOUT
  return variants[subVariant % variants.length] ?? variants[0] ?? FALLBACK_LAYOUT
}

const imagePlaceholder = (i: number, slot: LayoutSlot) => (
  <div
    className="flex h-full w-full flex-col items-center justify-center gap-3"
    style={{
      background: `color-mix(in srgb, var(--color-surface-alt) 85%, var(--color-accent) ${8 + i * 4}%)`,
    }}
  >
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none" style={{ opacity: 0.12 }}>
      <rect width="64" height="40" rx="3" fill="var(--color-text)" />
      <circle cx="20" cy="16" r="5" fill="var(--color-surface)" />
      <path d="M0 30 L24 18 L40 26 L64 12 V40 H0Z" fill="var(--color-surface)" opacity="0.5" />
    </svg>
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: TYPE.sm,
        color: 'var(--color-text-muted)',
        opacity: 0.5,
      }}
    >
      {slot.recWidth} &times; {slot.recHeight}px
    </span>
  </div>
)

export function BentoSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)
  const layout = getLayout(content.layoutVariant, styleVariant)
  const showBlurbs = content.showBlurbs !== false

  // Pad items to match layout slot count (handles legacy slides with fewer items)
  const items = content.items.length >= layout.slots.length
    ? content.items
    : [
        ...content.items,
        ...Array.from({ length: layout.slots.length - content.items.length }, (_, i) => ({
          image: '',
          description: `Image ${content.items.length + i + 1}`,
        })),
      ]

  return (
    <div
      className="relative flex h-[1080px] w-[1920px] flex-col"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex-1" style={{ padding: 'var(--slide-padding, 14px)', paddingBottom: '72px' }}>
        <div
          className="h-full"
          style={{
            display: 'grid',
            gridTemplateColumns: layout.gridTemplate,
            gridTemplateRows: layout.gridTemplateRows,
            gap: 'var(--slide-padding, 14px)',
          }}
        >
          {layout.slots.map((slot, i) => {
            const item = items[i]
            if (!item) return null

            return (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{
                  gridColumn: slot.gridColumn,
                  gridRow: slot.gridRow,
                  borderRadius: 'var(--border-radius)',
                }}
              >
                {/* Absolute-positioned image container to prevent layout blowout */}
                <div className="absolute inset-0">
                  <ImageDropZone
                    image={item.image}
                    onImageDrop={(url) => {
                      const items = [...content.items]
                      items[i] = { ...items[i], image: url }
                      update(slideId, { items } as any)
                    }}
                    onImageRemove={() => {
                      const items = [...content.items]
                      items[i] = { ...items[i], image: '' }
                      update(slideId, { items } as any)
                    }}
                    editable={editable}
                    className="h-full w-full"
                    placeholder={imagePlaceholder(i, slot)}
                    transformKey={`${slideId}:items.${i}`}
                  />
                </div>

                {showBlurbs && item.description && (
                  <div
                    className="absolute bottom-0 left-0 right-0 z-10 px-6 py-5"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 50%, transparent 100%)',
                    }}
                  >
                    <EditableText
                      value={item.description}
                      onChange={(v) => {
                        const items = [...content.items]
                        items[i] = { ...items[i], description: v }
                        update(slideId, { items } as any)
                      }}
                      as="p"
                      editable={editable}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: stepType('base', bodySizeStep),
                        color: '#ffffff',
                        fontWeight: 500,
                        letterSpacing: '0.01em',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
