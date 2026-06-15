import type { QuoteContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { BodyWidth } from '../../shared/BodyWidth'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { stepType } from '../../../constants/typography'

interface Props {
  content: QuoteContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  titleSizeStep?: number
  headingSizeStep?: number
  bodySizeStep?: number
}

const imagePlaceholder = (
  <div
    className="flex h-full w-full flex-col items-center justify-center gap-3"
    style={{ background: 'var(--color-surface-alt)' }}
  >
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none" style={{ opacity: 0.14 }}>
      <rect width="64" height="40" rx="3" fill="var(--color-text)" />
      <circle cx="20" cy="16" r="5" fill="var(--color-surface)" />
      <path d="M0 30 L24 18 L40 26 L64 12 V40 H0Z" fill="var(--color-surface)" opacity="0.5" />
    </svg>
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--color-text-muted)',
        opacity: 0.5,
      }}
    >
      3840 &times; 2160px
    </span>
  </div>
)

// Decorative opening quotation mark glyph
const QuoteMark = ({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 80"
    fill={color}
    style={{ flexShrink: 0, opacity }}
    aria-hidden="true"
  >
    <path d="M0 80 V40 C0 14 16 1 42 0 V18 C28 19 21 26 21 38 H40 V80 H0Z M58 80 V40 C58 14 74 1 100 0 V18 C86 19 79 26 79 38 H98 V80 H58Z" />
  </svg>
)

export function QuoteSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, titleSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const hasBg = !!content.backgroundImage

  const bgImage = (
    <div className="absolute inset-0">
      <ImageDropZone
        image={content.backgroundImage}
        onImageDrop={(url) => update(slideId, { backgroundImage: url } as any)}
        onImageRemove={() => update(slideId, { backgroundImage: '' } as any)}
        editable={editable}
        className="h-full w-full"
        imgClassName="h-full w-full object-cover"
        placeholder={imagePlaceholder}
        transformKey={`${slideId}:backgroundImage`}
      />
    </div>
  )

  const quoteField = (size: string, color: string, opts?: { italic?: boolean; weight?: number; align?: 'left' | 'center'; maxWidth?: string }) => (
    <EditableText
      value={content.quote}
      onChange={(v) => update(slideId, { quote: v } as any)}
      as="p"
      editable={editable}
      multiline
      style={{
        fontFamily: 'var(--font-header)',
        fontSize: size,
        fontWeight: opts?.weight ?? 500,
        fontStyle: opts?.italic ? 'italic' : 'normal',
        lineHeight: 1.25,
        color,
        textAlign: opts?.align ?? 'left',
        maxWidth: opts?.maxWidth,
        letterSpacing: '-0.01em',
      }}
    />
  )

  const attributionField = (color: string, align: 'left' | 'center' = 'left') => (
    <EditableText
      value={content.attribution}
      onChange={(v) => update(slideId, { attribution: v } as any)}
      as="span"
      editable={editable}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: stepType('xl', bodySizeStep),
        fontWeight: 700,
        color,
        lineHeight: 1.3,
        textAlign: align,
      }}
    />
  )

  const roleField = (color: string, align: 'left' | 'center' = 'left') => (
    <EditableText
      value={content.role}
      onChange={(v) => update(slideId, { role: v } as any)}
      as="span"
      editable={editable}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: stepType('lg', bodySizeStep),
        fontWeight: 400,
        color,
        opacity: 0.6,
        lineHeight: 1.3,
        textAlign: align,
      }}
    />
  )

  // ── A: Centered large quote. Full-bleed image + scrim if set, else solid surface. ──
  if (styleVariant === 0) {
    const onImage = hasBg
    const textColor = onImage ? '#ffffff' : 'var(--color-text)'
    const attrColor = onImage ? '#ffffff' : 'var(--color-text)'
    const roleColor = onImage ? '#ffffff' : 'var(--color-text)'

    return (
      <div
        className="relative flex h-[1080px] w-[1920px] items-center justify-center overflow-hidden"
        style={{ background: 'var(--color-surface)' }}
      >
        {onImage && bgImage}
        {onImage && (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.65))' }}
          />
        )}
        <div className="relative z-10 flex flex-col items-center px-32 pb-24">
          <QuoteMark size={72} color="var(--color-accent)" opacity={onImage ? 0.95 : 1} />
          <BodyWidth slideId={slideId} editable={editable} align="center" style={{ marginTop: '40px' }}>
            {quoteField(stepType('3xl', titleSizeStep), textColor, { align: 'center' })}
          </BodyWidth>
          <div className="mt-8 flex flex-col items-center gap-2">
            {attributionField(attrColor, 'center')}
            {roleField(roleColor, 'center')}
          </div>
        </div>
      </div>
    )
  }

  // ── B: Left-aligned with big decorative accent quotation mark above. No image. ──
  if (styleVariant === 1) {
    return (
      <div
        className="relative flex h-[1080px] w-[1920px] flex-col justify-center px-28"
        style={{ background: 'var(--color-surface)' }}
      >
        <QuoteMark size={140} color="var(--color-accent)" />
        <BodyWidth slideId={slideId} editable={editable} style={{ marginTop: '40px' }}>
          {quoteField(stepType('3xl', titleSizeStep), 'var(--color-text)')}
        </BodyWidth>
        <div className="mt-12 flex items-center gap-5">
          <div className="h-[44px] w-[3px]" style={{ background: 'var(--color-accent)' }} />
          <div className="flex flex-col gap-1.5">
            {attributionField('var(--color-text)')}
            {roleField('var(--color-text)')}
          </div>
        </div>
      </div>
    )
  }

  // ── C: Quote over full-bleed editable image, strong dark scrim, white text, lower-left. ──
  if (styleVariant === 2) {
    return (
      <div
        className="relative flex h-[1080px] w-[1920px] overflow-hidden"
        style={{ background: 'var(--color-surface-alt)' }}
      >
        {bgImage}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.15) 100%)' }}
        />
        <div className="relative z-10 flex h-full w-full flex-col justify-end px-24 pb-28">
          <QuoteMark size={88} color="var(--color-accent)" />
          <BodyWidth slideId={slideId} editable={editable} style={{ marginTop: '32px' }}>
            {quoteField(stepType('2xl', titleSizeStep), '#ffffff')}
          </BodyWidth>
          <div className="mt-10 flex flex-col gap-2">
            {attributionField('#ffffff')}
            {roleField('#ffffff')}
          </div>
        </div>
      </div>
    )
  }

  // ── D: Two-column — large quote left, attribution card right. No image. ──
  return (
    <div
      className="relative flex h-[1080px] w-[1920px] items-center"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex w-full items-center gap-24 px-28 pb-12">
        <div className="flex-1">
          <QuoteMark size={96} color="var(--color-accent)" opacity={0.9} />
          <BodyWidth slideId={slideId} editable={editable} style={{ marginTop: '32px' }}>
            {quoteField(stepType('3xl', titleSizeStep), 'var(--color-text)')}
          </BodyWidth>
        </div>
        <div
          className="flex w-[420px] flex-shrink-0 flex-col gap-4 p-12"
          style={{
            background: 'var(--color-surface-alt)',
            borderRadius: 'var(--border-radius)',
            boxShadow: darkMode ? 'none' : '0 8px 40px rgba(0,0,0,0.08)',
          }}
        >
          {attributionField('var(--color-text)')}
          {roleField('var(--color-text)')}
        </div>
      </div>
    </div>
  )
}
