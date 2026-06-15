import type { ProcessContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { stepType } from '../../../constants/typography'
import { SlideBackdrop } from './SlideBackdrop'

interface Props {
  content: ProcessContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

export function ProcessSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)
  const steps = content.steps ?? []

  const setStep = (i: number, patch: Partial<{ title: string; description: string }>) => {
    const copy = steps.map((s) => ({ ...s }))
    copy[i] = { ...copy[i], ...patch }
    update(slideId, { steps: copy } as any)
  }

  const num = (i: number) => String(i + 1).padStart(2, '0')

  const headingEl = (size: string, maxWidth?: string) => (
    <EditableText
      value={content.heading}
      onChange={(v) => update(slideId, { heading: v } as any)}
      as="h2"
      editable={editable}
      style={{
        fontFamily: 'var(--font-header)',
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.05,
        color: 'var(--color-text)',
        maxWidth,
      }}
    />
  )

  const stepTitle = (i: number, size: string, className = '') => (
    <EditableText
      value={steps[i].title}
      onChange={(v) => setStep(i, { title: v })}
      as="h3"
      editable={editable}
      className={className}
      style={{
        fontFamily: 'var(--font-header)',
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.15,
        color: 'var(--color-text)',
      }}
    />
  )

  const stepDesc = (i: number, size: string, className = '', maxWidth?: string) => (
    <EditableText
      value={steps[i].description}
      onChange={(v) => setStep(i, { description: v })}
      as="p"
      editable={editable}
      multiline
      className={className}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: size,
        lineHeight: 1.6,
        color: 'var(--color-text-muted)',
        maxWidth,
      }}
    />
  )

  // ── A (0): heading top-left; steps as an evenly-spaced horizontal row ──
  if (styleVariant === 0) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col px-24 pt-24 pb-28">
        <p
          className="mb-4"
          style={{ fontFamily: 'var(--font-body)', fontSize: stepType('xs', bodySizeStep), fontWeight: 700, letterSpacing: '0.18em', color: 'var(--color-accent)', textTransform: 'uppercase' }}
        >
          Process
        </p>
        {headingEl(stepType('5xl', headingSizeStep), '1100px')}

        <div className="flex flex-1 items-center">
          <div className="relative w-full">
            {/* Hairline linking the numbers */}
            <div className="absolute left-0 right-0" style={{ top: '36px', height: '1px', background: 'var(--color-text-muted)', opacity: 0.25 }} />
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, 1fr)`, gap: '56px' }}>
              {steps.map((_, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center" style={{ height: '72px' }}>
                    <span
                      className="flex items-center"
                      style={{
                        fontFamily: 'var(--font-header)',
                        fontSize: stepType('5xl', headingSizeStep),
                        fontWeight: 800,
                        lineHeight: 1,
                        color: 'var(--color-accent)',
                        background: 'var(--color-surface)',
                        paddingRight: '20px',
                      }}
                    >
                      {num(i)}
                    </span>
                  </div>
                  {stepTitle(i, stepType('xl', headingSizeStep), 'mt-7 mb-3')}
                  {stepDesc(i, stepType('base', bodySizeStep))}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    )
  }

  // ── B (1): heading top; steps as a vertical numbered list w/ accent badges ──
  if (styleVariant === 1) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col px-28 pt-24 pb-28">
        {headingEl(stepType('5xl', headingSizeStep), '1200px')}

        <div className="mt-10 flex flex-1 flex-col justify-center" style={{ maxWidth: '1280px' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-10"
              style={{
                paddingTop: i === 0 ? 0 : '28px',
                paddingBottom: '28px',
                borderBottom: i === steps.length - 1 ? 'none' : '1px solid color-mix(in srgb, var(--color-text-muted) 22%, transparent)',
              }}
            >
              <div
                className="flex flex-shrink-0 items-center justify-center"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '9999px',
                  background: 'var(--color-accent)',
                  fontFamily: 'var(--font-header)',
                  fontSize: stepType('xl', headingSizeStep),
                  fontWeight: 800,
                  color: 'var(--color-surface)',
                  lineHeight: 1,
                }}
              >
                {num(i)}
              </div>
              <div className="flex-1 pt-1">
                {stepTitle(i, stepType('2xl', headingSizeStep), 'mb-2')}
                {stepDesc(i, stepType('lg', bodySizeStep), '', '900px')}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    )
  }

  // ── C (2): heading top-left; steps in a 2-column grid (2x2 for four) ──
  if (styleVariant === 2) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col px-28 pt-24 pb-28">
        <p
          className="mb-4"
          style={{ fontFamily: 'var(--font-body)', fontSize: stepType('xs', bodySizeStep), fontWeight: 700, letterSpacing: '0.18em', color: 'var(--color-accent)', textTransform: 'uppercase' }}
        >
          Process
        </p>
        {headingEl(stepType('5xl', headingSizeStep), '1100px')}

        <div className="mt-12 grid flex-1 content-center" style={{ gridTemplateColumns: '1fr 1fr', columnGap: '120px', rowGap: '56px' }}>
          {steps.map((_, i) => (
            <div key={i} className="flex items-start gap-8">
              <span
                className="flex-shrink-0"
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: stepType('4xl', headingSizeStep),
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'var(--color-accent)',
                }}
              >
                {num(i)}
              </span>
              <div className="flex-1 pt-1">
                {stepTitle(i, stepType('2xl', headingSizeStep), 'mb-3')}
                {stepDesc(i, stepType('lg', bodySizeStep))}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    )
  }

  // ── D (3): large heading in left third; steps stacked in right two-thirds ──
  return (
    <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <SlideBackdrop image={content.backgroundImage} />
      <div className="relative z-10 flex h-full w-full">
      <div className="flex w-[640px] flex-shrink-0 flex-col justify-center px-24 pb-28">
        <p
          className="mb-5"
          style={{ fontFamily: 'var(--font-body)', fontSize: stepType('xs', bodySizeStep), fontWeight: 700, letterSpacing: '0.18em', color: 'var(--color-accent)', textTransform: 'uppercase' }}
        >
          Process
        </p>
        {headingEl(stepType('6xl', headingSizeStep), '560px')}
      </div>

      <div
        className="flex flex-1 flex-col justify-center px-20 pb-28"
        style={{ borderLeft: '1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)' }}
      >
        {steps.map((_, i) => (
          <div
            key={i}
            className="flex items-baseline gap-8"
            style={{
              paddingTop: i === 0 ? 0 : '30px',
              paddingBottom: '30px',
              borderBottom: i === steps.length - 1 ? 'none' : '1px solid color-mix(in srgb, var(--color-text-muted) 18%, transparent)',
            }}
          >
            <span
              className="flex-shrink-0"
              style={{
                fontFamily: 'var(--font-header)',
                fontSize: stepType('3xl', headingSizeStep),
                fontWeight: 800,
                lineHeight: 1,
                color: 'var(--color-accent)',
                width: '90px',
              }}
            >
              {num(i)}
            </span>
            <div className="flex-1">
              {stepTitle(i, stepType('2xl', headingSizeStep), 'mb-2')}
              {stepDesc(i, stepType('lg', bodySizeStep), '', '880px')}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
