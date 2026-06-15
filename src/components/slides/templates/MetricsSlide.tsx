import type { MetricsContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { stepType } from '../../../constants/typography'
import { SlideBackdrop } from './SlideBackdrop'

interface Props {
  content: MetricsContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  titleSizeStep?: number
  headingSizeStep?: number
  bodySizeStep?: number
}

export function MetricsSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, titleSizeStep = 0, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)
  const stats = content.stats ?? []

  const setStat = (i: number, patch: Partial<{ value: string; label: string }>) => {
    const copy = stats.map((s) => ({ ...s }))
    copy[i] = { ...copy[i], ...patch }
    update(slideId, { stats: copy } as any)
  }

  const eyebrow = (
    <p
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: stepType('xs', bodySizeStep),
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: 'var(--color-accent)',
        textTransform: 'uppercase',
      }}
    >
      Results
    </p>
  )

  const heading = (size: string, maxWidth?: string, align?: 'left' | 'center') => (
    <EditableText
      value={content.heading}
      onChange={(v) => update(slideId, { heading: v } as any)}
      as="h2"
      editable={editable}
      style={{
        fontFamily: 'var(--font-header)',
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.08,
        color: 'var(--color-text)',
        maxWidth,
        textAlign: align,
      }}
    />
  )

  const statValue = (i: number, size: string, align?: 'left' | 'center' | 'right') => (
    <EditableText
      value={stats[i].value}
      onChange={(v) => setStat(i, { value: v })}
      as="span"
      editable={editable}
      style={{
        display: 'block',
        fontFamily: 'var(--font-header)',
        fontSize: size,
        fontWeight: 800,
        lineHeight: 0.95,
        letterSpacing: '-0.02em',
        color: 'var(--color-accent)',
        textAlign: align,
      }}
    />
  )

  const statLabel = (i: number, align?: 'left' | 'center' | 'right', maxWidth?: string) => (
    <EditableText
      value={stats[i].label}
      onChange={(v) => setStat(i, { label: v })}
      as="p"
      editable={editable}
      multiline
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: stepType('lg', bodySizeStep),
        fontWeight: 400,
        lineHeight: 1.4,
        color: 'var(--color-text-muted)',
        textAlign: align,
        maxWidth,
      }}
    />
  )

  // A: heading top-left; stats in an evenly-spaced horizontal row
  if (styleVariant === 0) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col px-32 pt-32 pb-40">
          <div className="mb-4">{eyebrow}</div>
          {heading(stepType('5xl', titleSizeStep), '1100px')}
          <div className="mt-auto flex items-end justify-between gap-16">
            {stats.map((_, i) => (
              <div key={i} className="flex flex-1 flex-col gap-5">
                {statValue(i, stepType('6xl', headingSizeStep), 'left')}
                {statLabel(i, 'left', '320px')}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // B: heading top; stats in a 2-column grid
  if (styleVariant === 1) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col px-32 pt-32 pb-32">
          <div className="mb-4">{eyebrow}</div>
          {heading(stepType('4xl', titleSizeStep), '1200px')}
          <div className="mt-16 grid flex-1 grid-cols-2 gap-x-24 gap-y-14">
            {stats.map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-center gap-4 px-12 py-10"
                style={{
                  background: 'var(--color-surface-alt)',
                  borderRadius: 'var(--border-radius)',
                }}
              >
                {statValue(i, stepType('5xl', headingSizeStep), 'left')}
                {statLabel(i, 'left', '440px')}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // C: heading on the left; stats stacked in a right column with hairline dividers
  if (styleVariant === 2) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full items-stretch gap-24 px-32 pt-32 pb-32">
          <div className="flex w-[680px] flex-shrink-0 flex-col justify-center">
            <div className="mb-5">{eyebrow}</div>
            {heading(stepType('4xl', titleSizeStep), '620px')}
          </div>
          <div className="flex flex-1 flex-col justify-center">
            {stats.map((_, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-12 py-10"
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--color-text-muted)',
                }}
              >
                <div className="flex-1">{statLabel(i, 'left', '480px')}</div>
                {statValue(i, stepType('5xl', headingSizeStep), 'right')}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // D: centered single row of large stats with the heading centered above
  return (
    <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <SlideBackdrop image={content.backgroundImage} />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-24 pb-20">
        <div className="mb-5 text-center">{eyebrow}</div>
        {heading(stepType('5xl', titleSizeStep), '1300px', 'center')}
        <div className="mt-20 flex w-full items-start justify-center gap-0">
          {stats.map((_, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-5 px-12"
              style={{
                borderLeft: i === 0 ? 'none' : '1px solid var(--color-text-muted)',
              }}
            >
              {statValue(i, stepType('6xl', headingSizeStep), 'center')}
              {statLabel(i, 'center', '300px')}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
