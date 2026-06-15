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
  headingSizeStep?: number
  bodySizeStep?: number
}

export function ColumnsSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)
  void darkMode
  const cols = content.columns ?? []
  const n = Math.max(1, cols.length)

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
  const hasHeading = !!content.heading && content.heading.replace(/<[^>]*>/g, '').replace(/&nbsp;| /g, ' ').trim() !== ''

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

  // ── A (0): Swiss grid — outer border, heading row, vertical dividers (like About D) ──
  if (styleVariant === 0) {
    const m = 60
    const cellPad = 36
    const line = '1px solid color-mix(in srgb, var(--color-text) 14%, transparent)'
    const headingH = hasHeading ? 200 : 0
    const contentW = 1920 - m * 2
    const colW = contentW / n
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="absolute inset-0 z-10">
          {/* Outer border */}
          <div className="absolute pointer-events-none" style={{ left: m, top: m, right: m, bottom: m, border: line }} />
          {/* Heading / columns divider */}
          {hasHeading && <div className="absolute pointer-events-none" style={{ left: m, right: m, top: m + headingH, borderTop: line }} />}
          {/* Vertical dividers between columns */}
          {Array.from({ length: n - 1 }).map((_, i) => (
            <div key={i} className="absolute pointer-events-none" style={{ left: m + colW * (i + 1), top: m + headingH, bottom: m, borderLeft: line }} />
          ))}
          {/* Heading */}
          {hasHeading && (
            <div className="absolute flex items-center" style={{ left: m + cellPad, top: m, height: headingH, width: contentW - cellPad * 2 }}>
              {heading(stepType('5xl', headingSizeStep))}
            </div>
          )}
          {/* Columns */}
          {cols.map((_, i) => (
            <div key={i} className="absolute flex flex-col" style={{ left: m + colW * i + cellPad, top: m + headingH + cellPad, width: colW - cellPad * 2, bottom: m + cellPad }}>
              {colTitle(i, stepType('2xl', headingSizeStep), { marginBottom: '18px' })}
              {colBody(i, stepType('base', bodySizeStep))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const faintLine = 'color-mix(in srgb, var(--color-text) 16%, transparent)'

  // ── B (1): Newspaper — heading with underline, bold top rule capping each column ──
  if (styleVariant === 1) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col" style={{ padding: '80px 88px 96px' }}>
          {hasHeading && (
            <div className="mb-12" style={{ borderBottom: `1px solid ${faintLine}`, paddingBottom: '28px' }}>
              {heading(stepType('4xl', headingSizeStep))}
            </div>
          )}
          <div className="flex flex-1" style={{ gap: '64px' }}>
            {cols.map((_, i) => (
              <div key={i} className="flex flex-1 flex-col" style={{ borderTop: '3px solid var(--color-text)', paddingTop: '24px' }}>
                {colTitle(i, stepType('xl', headingSizeStep), { marginBottom: '14px' })}
                {colBody(i, stepType('base', bodySizeStep))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── C (2): Oversized accent numerals leading each column ──
  if (styleVariant === 2) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col" style={{ padding: '80px 88px 96px' }}>
          {hasHeading && <div className="mb-14">{heading(stepType('4xl', headingSizeStep))}</div>}
          <div className="flex flex-1" style={{ gap: '56px' }}>
            {cols.map((_, i) => (
              <div key={i} className="flex flex-1 flex-col">
                <span style={{ fontFamily: 'var(--font-header)', fontSize: stepType('6xl', headingSizeStep), fontWeight: 800, color: 'var(--color-accent)', lineHeight: 0.85, letterSpacing: '-0.03em', marginBottom: '24px' }}>
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
        {hasHeading && <div className="mb-12">{heading(stepType('4xl', headingSizeStep))}</div>}
        <div className="flex flex-1" style={{ gap: '28px' }}>
          {cols.map((_, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col"
              style={{ border: `1px solid ${faintLine}`, borderRadius: 'var(--border-radius)', padding: '48px 44px' }}
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
