import type { AboutContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: AboutContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

const personPlaceholder = (
  <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--color-surface-alt)' }}>
    <svg width="160" height="160" viewBox="0 0 200 200" fill="none" style={{ opacity: 0.15 }}>
      <circle cx="100" cy="70" r="35" fill="var(--color-text-muted)" />
      <ellipse cx="100" cy="165" rx="55" ry="40" fill="var(--color-text-muted)" />
    </svg>
  </div>
)

export function AboutSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const headingEl = (fontSize: string, extra?: React.CSSProperties) => (
    <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
      style={{ fontFamily: 'var(--font-header)', fontSize, fontWeight: 900, color: 'var(--color-text)', lineHeight: 0.95, ...extra }} />
  )

  const paragraphEls = (fontSize: string, extra?: React.CSSProperties) =>
    content.paragraphs.map((p, i) => (
      <EditableText key={i} value={p} as="p" editable={editable} multiline
        onChange={(v) => { const paragraphs = [...content.paragraphs]; paragraphs[i] = v; update(slideId, { paragraphs } as any) }}
        style={{ fontFamily: 'var(--font-body)', fontSize, lineHeight: 1.6, color: 'var(--color-text)', opacity: i === 0 ? 1 : 0.7, ...extra }} />
    ))

  const imgBox = (w: string, h: string, round?: string) => (
    <div className="overflow-hidden flex-shrink-0" style={{ width: w, height: h, borderRadius: round ?? 'var(--border-radius)' }}>
      <ImageDropZone image={content.image} onImageDrop={(url) => update(slideId, { image: url } as any)}
        onImageRemove={() => update(slideId, { image: '' } as any)} editable={editable}
        className="h-full w-full" placeholder={personPlaceholder}
        transformKey={`${slideId}:image`} />
    </div>
  )

  const imgFull = (cls: string, bg?: string) => (
    <ImageDropZone image={content.image} onImageDrop={(url) => update(slideId, { image: url } as any)}
      onImageRemove={() => update(slideId, { image: '' } as any)} editable={editable}
      className={cls} style={{ background: bg ?? 'var(--color-surface-alt)' }} placeholder={personPlaceholder}
      transformKey={`${slideId}:image`} />
  )

  // A: Centered portrait, heading + text below (the keeper)
  if (styleVariant === 0) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] flex-col items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        {imgBox('380px', '380px')}
        <div className="mt-8 text-center">{headingEl(stepType('5xl', headingSizeStep), { textAlign: 'center' })}</div>
        <div className="mt-6 flex max-w-[900px] flex-col items-center gap-6 text-center">{paragraphEls(stepType('lg', bodySizeStep), { textAlign: 'center' })}</div>
      </div>
    )
  }

  // B: Image flush left half, heading overlaps the image/text boundary, text right — split composition
  if (styleVariant === 1) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {/* Image — left half, full height */}
        <div className="absolute left-0 top-0 bottom-0" style={{ width: '860px' }}>
          {imgFull('h-full w-full')}
        </div>
        {/* Text column — right side */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center px-16" style={{ left: '920px' }}>
          <div className="flex flex-col gap-6" style={{ maxWidth: '560px' }}>
            {paragraphEls(stepType('lg', bodySizeStep))}
          </div>
        </div>
        {/* Heading — overlapping the boundary, bottom-left */}
        <div className="absolute z-10" style={{ left: '60px', bottom: '80px', maxWidth: '1100px' }}>
          {headingEl(TYPE['7xl'], { letterSpacing: '-0.03em' })}
        </div>
      </div>
    )
  }

  // C: Image flush right half, heading top-left, text below heading — mirrored split
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {/* Image — right half, full height */}
        <div className="absolute right-0 top-0 bottom-0" style={{ width: '860px' }}>
          {imgFull('h-full w-full')}
        </div>
        {/* Heading — top-left */}
        <div className="absolute left-[60px] top-[80px] z-10" style={{ maxWidth: '900px' }}>
          {headingEl(TYPE['7xl'], { letterSpacing: '-0.03em' })}
        </div>
        {/* Text — left column, vertically centered */}
        <div className="absolute left-[60px] top-0 bottom-0 flex flex-col justify-center" style={{ width: '960px', paddingTop: '240px' }}>
          <div className="flex flex-col gap-6" style={{ maxWidth: '560px' }}>
            {paragraphEls(stepType('lg', bodySizeStep))}
          </div>
        </div>
      </div>
    )
  }

  // D: Swiss grid with visible borders — Stripe-inspired
  // Grid: 60px margin, then columns with lines
  const m = 60 // outer margin
  const lineStyle = `1px solid color-mix(in srgb, var(--color-text) 12%, transparent)`

  // Column positions — image is narrower (cols 1-2 out of 5)
  const col1 = m
  const col2 = 420
  const col3 = 780
  const col4 = 1140
  const col5 = 1500
  const colEnd = 1920 - m

  // Row positions (3 rows)
  const row1 = m
  const row2 = 400
  const row3 = 720
  const rowEnd = 1080 - m

  const cellPad = 32

  return (
    <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      {/* Grid lines — segmented to avoid crossing content */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        {/* Outer border */}
        <div className="absolute" style={{ left: m, top: m, right: m, bottom: m, border: lineStyle }} />

        {/* === VERTICAL LINES === */}
        {/* col2: row 3 only (skip image rows 1-2 and heading) */}
        {/* col3: full height — boundary between image/heading and text/empty */}
        <div className="absolute" style={{ left: col3, top: m, bottom: m, borderLeft: lineStyle }} />

        {/* col4: row 3 only */}
        <div className="absolute" style={{ left: col4, top: row3, bottom: m, borderLeft: lineStyle }} />

        {/* col5: row 3 only */}
        <div className="absolute" style={{ left: col5, top: row3, bottom: m, borderLeft: lineStyle }} />

        {/* === HORIZONTAL LINES === */}
        {/* row3: full width — boundary between content and bottom */}
        <div className="absolute" style={{ left: m, right: m, top: row3, borderTop: lineStyle }} />
      </div>

      {/* Image — cols 1-2, rows 1-2 */}
      <div className="absolute overflow-hidden" style={{
        left: m + cellPad, top: m + cellPad,
        width: col3 - col1 - cellPad * 2,
        height: row3 - row1 - cellPad * 2,
        zIndex: 2,
      }}>
        {imgFull('h-full w-full', 'transparent')}
      </div>

      {/* Text — cols 3-4, rows 1-2 (stays within two columns, doesn't cross col5 line) */}
      <div className="absolute flex flex-col justify-center overflow-hidden" style={{
        left: col3 + cellPad,
        top: m + cellPad,
        width: col5 - col3 - cellPad * 2,
        height: row3 - row1 - cellPad * 2,
        zIndex: 2,
      }}>
        <div className="flex flex-col gap-6">
          {paragraphEls(stepType('body', bodySizeStep))}
        </div>
      </div>

      {/* Heading — cols 1-2, row 3 */}
      <div className="absolute flex items-center overflow-hidden" style={{
        left: m + cellPad,
        top: row3 + cellPad,
        width: col3 - col1 - cellPad * 2,
        height: rowEnd - row3 - cellPad * 2,
        zIndex: 2,
      }}>
        {headingEl(TYPE['7xl'], { letterSpacing: '-0.04em' })}
      </div>
    </div>
  )
}
