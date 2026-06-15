import type { ColumnsContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { stepType } from '../../../constants/typography'
import { SlideBackdrop } from './SlideBackdrop'

interface Props {
  content: ColumnsContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  titleSizeStep?: number
  headingSizeStep?: number
  bodySizeStep?: number
}

export function ColumnsSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, titleSizeStep = 0, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)
  void darkMode
  const cols = content.columns ?? []
  const n = Math.max(1, cols.length)
  const rows = Math.max(1, Math.min(2, content.rows ?? 1))
  const colCount = Math.max(1, Math.ceil(n / rows))

  const setCol = (i: number, key: 'title' | 'body', v: string) => {
    const next = cols.map((c, j) => (j === i ? { ...c, [key]: v } : c))
    update(slideId, { columns: next } as any)
  }

  const heading = (size: string, extra?: React.CSSProperties) => (
    <EditableText
      value={content.heading}
      onChange={(v) => update(slideId, { heading: v } as any)}
      as="h2"
      editable={editable}
      style={{ fontFamily: 'var(--font-header)', fontSize: size, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.05, ...extra }}
    />
  )
  const hasHeading = !!content.heading && content.heading.replace(/<[^>]*>/g, '').replace(/&nbsp;| /g, ' ').trim() !== ''

  const colTitle = (i: number, size: string, extra?: React.CSSProperties) => (
    <EditableText
      value={cols[i].title}
      onChange={(v) => setCol(i, 'title', v)}
      as="h3"
      editable={editable}
      style={{ fontFamily: 'var(--font-header)', fontSize: size, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.18, ...extra }}
    />
  )
  const colBody = (i: number, size: string, extra?: React.CSSProperties) => (
    <EditableText
      value={cols[i].body}
      onChange={(v) => setCol(i, 'body', v)}
      as="p"
      editable={editable}
      multiline
      style={{ fontFamily: 'var(--font-body)', fontSize: size, lineHeight: 1.6, color: 'var(--color-text)', opacity: 0.66, ...extra }}
    />
  )

  // CSS grid sized to colCount × rows
  const gridStyle = (gap: string): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    gap,
  })

  const faintLine = 'color-mix(in srgb, var(--color-text) 16%, transparent)'

  // ── A (0): Swiss grid — outer border, heading row, internal dividers (both axes) ──
  if (styleVariant === 0) {
    const m = 60
    const cellPad = 36
    const line = '1px solid color-mix(in srgb, var(--color-text) 14%, transparent)'
    const headingH = hasHeading ? 200 : 0
    const cellCount = colCount * rows
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="absolute inset-0 z-10">
          {/* Outer border */}
          <div className="absolute pointer-events-none" style={{ left: m, top: m, right: m, bottom: m, border: line }} />
          {/* Heading / grid divider */}
          {hasHeading && <div className="absolute pointer-events-none" style={{ left: m, right: m, top: m + headingH, borderTop: line }} />}
          {/* Heading */}
          {hasHeading && (
            <div className="absolute flex items-center" style={{ left: m + cellPad, top: m, height: headingH, width: 1920 - m * 2 - cellPad * 2 }}>
              {heading(stepType('5xl', titleSizeStep))}
            </div>
          )}
          {/* Grid of cells with internal lines via per-cell borders */}
          <div className="absolute" style={{ left: m, top: m + headingH, right: m, bottom: m, ...gridStyle('0px') }}>
            {Array.from({ length: cellCount }).map((_, idx) => {
              const col = idx % colCount
              const row = Math.floor(idx / colCount)
              const item = cols[idx]
              return (
                <div key={idx} className="flex flex-col justify-start" style={{
                  padding: cellPad,
                  borderRight: col < colCount - 1 ? line : undefined,
                  borderBottom: row < rows - 1 ? line : undefined,
                  overflow: 'hidden',
                }}>
                  {item && colTitle(idx, stepType('2xl', headingSizeStep), { marginBottom: '16px' })}
                  {item && colBody(idx, stepType('base', bodySizeStep))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── B (1): Newspaper — heading underline, bold top rule capping each cell ──
  if (styleVariant === 1) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col" style={{ padding: '80px 88px 96px' }}>
          {hasHeading && (
            <div className="mb-12" style={{ borderBottom: `1px solid ${faintLine}`, paddingBottom: '28px' }}>
              {heading(stepType('4xl', titleSizeStep))}
            </div>
          )}
          <div className="flex-1" style={gridStyle('44px 64px')}>
            {cols.map((_, i) => (
              <div key={i} className="flex flex-col" style={{ borderTop: '3px solid var(--color-text)', paddingTop: '24px' }}>
                {colTitle(i, stepType('xl', headingSizeStep), { marginBottom: '14px' })}
                {colBody(i, stepType('base', bodySizeStep))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── C (2): Oversized accent numerals leading each cell ──
  if (styleVariant === 2) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col" style={{ padding: '80px 88px 96px' }}>
          {hasHeading && <div className="mb-14">{heading(stepType('4xl', titleSizeStep))}</div>}
          <div className="flex-1" style={gridStyle('48px 56px')}>
            {cols.map((_, i) => (
              <div key={i} className="flex flex-col">
                <span style={{ fontFamily: 'var(--font-header)', fontSize: stepType('6xl', headingSizeStep), fontWeight: 800, color: 'var(--color-accent)', lineHeight: 0.85, letterSpacing: '-0.03em', marginBottom: '20px' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {colTitle(i, stepType('xl', headingSizeStep), { marginBottom: '12px' })}
                {colBody(i, stepType('base', bodySizeStep))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── D (3): Refined outlined cards ──
  return (
    <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <SlideBackdrop image={content.backgroundImage} />
      <div className="relative z-10 flex h-full w-full flex-col" style={{ padding: '80px 88px 96px' }}>
        {hasHeading && <div className="mb-12">{heading(stepType('4xl', titleSizeStep))}</div>}
        <div className="flex-1" style={gridStyle('28px')}>
          {cols.map((_, i) => (
            <div
              key={i}
              className="flex flex-col"
              style={{ border: `1px solid ${faintLine}`, borderRadius: 'var(--border-radius)', padding: '40px 36px' }}
            >
              {colTitle(i, stepType('2xl', headingSizeStep), { marginBottom: '16px' })}
              {colBody(i, stepType('base', bodySizeStep))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
