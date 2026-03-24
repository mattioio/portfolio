import { useMemo } from 'react'
import type { WorkHistoryContent, CVContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: WorkHistoryContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

interface TimelineEntry {
  company: string
  role: string
  dateRange: string
}

/** Render HTML content safely (CV slides store HTML from contentEditable) */
function Html({ html, style, className }: { html: string; style?: React.CSSProperties; className?: string }) {
  return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}

export function WorkHistorySlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  // Derive entries live from CV slides — always in sync
  const slides = usePortfolioStore((s) => s.slides)
  const entries: TimelineEntry[] = useMemo(() => {
    const cvSlides = slides.filter((sl) => sl.type === 'cv')
    if (cvSlides.length > 0) {
      return cvSlides.map((s) => {
        const c = s.content as CVContent
        return { company: c.company, role: c.roleBadge, dateRange: c.dateRange ?? '' }
      })
    }
    return content.entries ?? []
  }, [slides, content.entries])

  // A: Horizontal timeline — dots on a line, company above, date below
  if (styleVariant === 0) {
    const totalEntries = entries.length
    const lineY = 540 // vertical center
    const padX = 200
    const availableW = 1920 - padX * 2
    const spacing = totalEntries > 1 ? availableW / (totalEntries - 1) : 0

    return (
      <div className="relative flex h-[1080px] w-[1920px] flex-col overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {/* Heading */}
        <div className="px-20 pt-20">
          <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
            style={{ fontFamily: 'var(--font-header)', fontSize: stepType('5xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.05 }} />
        </div>

        {/* Timeline */}
        <div className="relative flex-1">
          {/* Horizontal line */}
          <div className="absolute" style={{
            left: padX, right: padX, top: lineY - 60, height: '2px',
            background: `color-mix(in srgb, var(--color-text) 15%, transparent)`,
          }} />

          {entries.map((entry, i) => {
            const x = totalEntries === 1 ? 1920 / 2 : padX + i * spacing

            return (
              <div key={i} className="absolute" style={{ left: x, top: lineY - 60, transform: 'translateX(-50%)' }}>
                {/* Dot */}
                <div className="absolute left-1/2 -translate-x-1/2" style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: 'var(--color-accent)',
                  opacity: i === 0 ? 1 : 0.3,
                  top: '-7px',
                }} />

                {/* Company + Role — above the line */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center" style={{ width: '280px' }}>
                  <Html html={entry.company} style={{ fontFamily: 'var(--font-header)', fontSize: stepType('2xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.15, marginBottom: '8px', display: 'block' }} />
                  <Html html={entry.role} style={{ fontFamily: 'var(--font-body)', fontSize: stepType('sm', bodySizeStep), color: 'var(--color-text)', opacity: 0.6, lineHeight: 1.4, display: 'block' }} />
                </div>

                {/* Date — below the line */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center" style={{ width: '200px' }}>
                  <Html html={entry.dateRange} style={{ fontFamily: 'var(--font-body)', fontSize: stepType('sm', bodySizeStep), fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '0.05em' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // B: Vertical timeline — line flows from heading down through entries
  if (styleVariant === 1) {
    const lineX = 100 // x position of the vertical line
    const entryGap = Math.min(80, Math.max(40, 600 / entries.length))

    return (
      <div className="relative flex h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {/* Vertical line — starts at heading, flows through all entries */}
        <div className="absolute" style={{
          left: `${lineX}px`, top: '80px', bottom: '100px', width: '2px',
          background: `color-mix(in srgb, var(--color-text) 12%, transparent)`,
        }} />

        {/* Heading — positioned next to the line */}
        <div className="absolute" style={{ left: `${lineX + 40}px`, top: '60px', right: '80px' }}>
          <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
            style={{ fontFamily: 'var(--font-header)', fontSize: stepType('5xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.0 }} />
        </div>

        {/* Entries — below the heading, aligned to the line */}
        <div className="absolute flex flex-col" style={{ left: '0', right: '0', top: '240px', paddingLeft: `${lineX - 7}px`, gap: `${entryGap}px` }}>
          {entries.map((entry, i) => (
            <div key={i} className="relative flex items-start gap-8">
              {/* Dot on the line */}
              <div className="flex-shrink-0" style={{
                width: '14px', height: '14px', borderRadius: '50%',
                background: 'var(--color-accent)',
                marginTop: '8px',
              }} />

              {/* Content */}
              <div className="flex flex-col" style={{ paddingLeft: '16px' }}>
                <Html html={entry.dateRange} style={{ fontFamily: 'var(--font-body)', fontSize: stepType('xs', bodySizeStep), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '6px', display: 'block' }} />
                <Html html={entry.company} style={{ fontFamily: 'var(--font-header)', fontSize: stepType('2xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.15, marginBottom: '4px', display: 'block' }} />
                <Html html={entry.role} style={{ fontFamily: 'var(--font-body)', fontSize: stepType('base', bodySizeStep), color: 'var(--color-text)', opacity: 0.55, display: 'block' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // C: Staggered cards — alternating left/right on a central vertical line
  if (styleVariant === 2) {
    const cardH = Math.min(160, Math.max(100, 700 / entries.length))
    const totalH = entries.length * cardH + (entries.length - 1) * 24
    const startY = (1080 - totalH) / 2

    return (
      <div className="relative flex h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {/* Heading — top left */}
        <div className="absolute left-20 top-16 z-10">
          <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
            style={{ fontFamily: 'var(--font-header)', fontSize: stepType('4xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.05 }} />
        </div>

        {/* Central line */}
        <div className="absolute" style={{
          left: '50%', top: `${startY}px`, bottom: `${1080 - startY - totalH}px`, width: '2px',
          transform: 'translateX(-50%)',
          background: `color-mix(in srgb, var(--color-text) 12%, transparent)`,
        }} />

        {entries.map((entry, i) => {
          const isLeft = i % 2 === 0
          const y = startY + i * (cardH + 24)

          return (
            <div key={i} className="absolute" style={{
              top: y,
              left: isLeft ? '80px' : '50%',
              right: isLeft ? '50%' : '80px',
              height: `${cardH}px`,
              display: 'flex', alignItems: 'center',
              paddingLeft: isLeft ? '0' : '40px',
              paddingRight: isLeft ? '40px' : '0',
            }}>
              {/* Dot */}
              <div className="absolute" style={{
                [isLeft ? 'right' : 'left']: '-8px',
                top: '50%', transform: 'translateY(-50%)',
                width: '14px', height: '14px', borderRadius: '50%',
                background: 'var(--color-accent)',
                zIndex: 2,
              }} />

              {/* Card */}
              <div className="flex w-full flex-col rounded-lg p-6" style={{
                background: `color-mix(in srgb, var(--color-text) 4%, transparent)`,
                textAlign: isLeft ? 'right' : 'left',
              }}>
                <Html html={entry.dateRange} style={{ fontFamily: 'var(--font-body)', fontSize: stepType('xs', bodySizeStep), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '6px', display: 'block' }} />
                <Html html={entry.company} style={{ fontFamily: 'var(--font-header)', fontSize: stepType('2xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.15, marginBottom: '2px', display: 'block' }} />
                <Html html={entry.role} style={{ fontFamily: 'var(--font-body)', fontSize: stepType('sm', bodySizeStep), color: 'var(--color-text)', opacity: 0.55, display: 'block' }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // D: Swiss grid — original row layout wrapped in Stripe-inspired grid lines
  const m = 60 // outer margin
  const lineStyle = `1px solid color-mix(in srgb, var(--color-text) 12%, transparent)`
  const cellPad = 32

  // Layout: heading + entries vertically centered as a block
  const headingH = 200
  const maxRowH = 100
  const entryRowH = Math.min(maxRowH, 100)
  const totalEntriesH = entries.length * entryRowH
  const blockH = headingH + totalEntriesH
  // Top empty box matches the heading section height so the grid looks balanced
  const blockTop = m + headingH
  const headingBottom = blockTop + headingH
  const entryAreaTop = headingBottom

  // Vertical column positions for the grid lines (date | company | role)
  const colDate = m + 260
  const colRole = 1320

  return (
    <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        {/* Outer border */}
        <div className="absolute" style={{ left: m, top: m, right: m, bottom: m, border: lineStyle }} />

        {/* Horizontal: heading/entries boundary + top of heading */}
        <div className="absolute" style={{ left: m, right: m, top: blockTop, borderTop: lineStyle }} />
        <div className="absolute" style={{ left: m, right: m, top: headingBottom, borderTop: lineStyle }} />

        {/* Vertical lines through entry area only */}
        <div className="absolute" style={{ left: colDate, top: headingBottom, height: totalEntriesH, borderLeft: lineStyle }} />
        <div className="absolute" style={{ left: colRole, top: headingBottom, height: totalEntriesH, borderLeft: lineStyle }} />

        {/* Bottom boundary of entries */}
        <div className="absolute" style={{ left: m, right: m, top: entryAreaTop + totalEntriesH, borderTop: lineStyle }} />

        {/* Row dividers between entries */}
        {entries.map((_, i) => {
          if (i === 0) return null
          const y = entryAreaTop + i * entryRowH
          return (
            <div key={i} className="absolute" style={{ left: m, right: m, top: y, borderTop: lineStyle }} />
          )
        })}
      </div>

      {/* Heading — above entries, offset right of the timeline */}
      <div className="absolute flex items-center" style={{
        left: m + cellPad + 30, top: blockTop + cellPad,
        width: 1920 - m * 2 - cellPad * 2 - 30, height: headingH - cellPad * 2,
        zIndex: 2,
      }}>
        <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
          style={{ fontFamily: 'var(--font-header)', fontSize: stepType('5xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.05 }} />
      </div>

      {/* Timeline — line with terminal dot at the heading */}
      {(() => {
        const lineLeft = m + cellPad + 4
        const headingCenter = blockTop + headingH / 2
        const lineBottom = entryAreaTop + (entries.length - 1) * entryRowH + entryRowH / 2
        const dotSize = 9
        return (
          <>
            {/* Terminal dot — vertically centred to the heading */}
            <div className="absolute" style={{
              left: lineLeft - Math.floor(dotSize / 2),
              top: blockTop + headingH / 2 - Math.floor(dotSize / 2),
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              zIndex: 3,
            }} />
            {/* Vertical line */}
            <div className="absolute" style={{
              left: lineLeft,
              top: headingCenter,
              height: lineBottom - headingCenter,
              width: '1px',
              background: `color-mix(in srgb, var(--color-text) 15%, transparent)`,
              zIndex: 2,
            }} />
          </>
        )
      })()}

      {/* Entries — each in its own grid row */}
      {entries.map((entry, i) => {
        const rowTop = entryAreaTop + i * entryRowH

        return (
          <div key={i} className="absolute" style={{ left: m, right: m, top: rowTop, height: entryRowH, zIndex: 2 }}>
            {/* Timeline dot — small circle */}
            <div className="absolute" style={{
              left: cellPad,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: 'var(--color-accent)',
              zIndex: 3,
            }} />

            {/* Date */}
            <div className="absolute flex items-center" style={{
              left: cellPad + 24, top: 0, width: colDate - m - cellPad - 24, height: '100%',
            }}>
              <Html html={entry.dateRange} style={{ fontFamily: 'var(--font-body)', fontSize: stepType('sm', bodySizeStep), fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '0.04em' }} />
            </div>

            {/* Company */}
            <div className="absolute flex items-center" style={{
              left: colDate - m + cellPad, top: 0, width: colRole - colDate - cellPad * 2, height: '100%',
            }}>
              <Html html={entry.company} style={{ fontFamily: 'var(--font-header)', fontSize: stepType('3xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.15 }} />
            </div>

            {/* Role */}
            <div className="absolute flex items-center" style={{
              left: colRole - m + cellPad, top: 0, width: 1920 - m - colRole - cellPad * 2, height: '100%',
            }}>
              <Html html={entry.role} style={{ fontFamily: 'var(--font-body)', fontSize: stepType('base', bodySizeStep), color: 'var(--color-text)', opacity: 0.5 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
