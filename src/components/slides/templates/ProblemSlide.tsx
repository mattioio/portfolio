import type { ProblemContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { stepType } from '../../../constants/typography'
import { BodyWidth } from '../../shared/BodyWidth'
import { SlideBackdrop } from './SlideBackdrop'

interface Props {
  content: ProblemContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

export function ProblemSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)
  void darkMode

  const label = (extraStyle?: React.CSSProperties) => (
    <EditableText
      value={content.label}
      onChange={(v) => update(slideId, { label: v } as any)}
      as="p"
      editable={editable}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: stepType('sm', bodySizeStep),
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: 'var(--color-accent)',
        textTransform: 'uppercase',
        ...extraStyle,
      }}
    />
  )

  const statement = (size: string, extraStyle?: React.CSSProperties) => (
    <EditableText
      value={content.statement}
      onChange={(v) => update(slideId, { statement: v } as any)}
      as="h2"
      editable={editable}
      style={{
        fontFamily: 'var(--font-header)',
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.04,
        color: 'var(--color-text)',
        ...extraStyle,
      }}
    />
  )

  const context = (size: string, extraStyle?: React.CSSProperties) => (
    <EditableText
      value={content.context}
      onChange={(v) => update(slideId, { context: v } as any)}
      as="p"
      editable={editable}
      multiline
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: size,
        fontWeight: 400,
        lineHeight: 1.65,
        color: 'var(--color-text)',
        opacity: 0.65,
        ...extraStyle,
      }}
    />
  )

  // A: Left-aligned, vertically centered
  if (styleVariant === 0) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col justify-center px-32 pb-24">
          {label({ marginBottom: '28px' })}
          {statement(stepType('5xl', headingSizeStep), { maxWidth: '1200px' })}
          <BodyWidth slideId={slideId} editable={editable}>{context(stepType('lg', bodySizeStep), { marginTop: '40px' })}</BodyWidth>
        </div>
      </div>
    )
  }

  // B: Centered version of A
  if (styleVariant === 1) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-32 pb-24 text-center">
          {label({ marginBottom: '28px' })}
          {statement(stepType('5xl', headingSizeStep), { maxWidth: '1100px' })}
          <BodyWidth slideId={slideId} editable={editable}>{context(stepType('lg', bodySizeStep), { marginTop: '40px' })}</BodyWidth>
        </div>
      </div>
    )
  }

  // C: Two-column — statement left, context right
  if (styleVariant === 2) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <SlideBackdrop image={content.backgroundImage} />
        <div className="relative z-10 flex h-full w-full items-center gap-24 px-32 pb-24">
          <div className="flex flex-1 flex-col">
            {label({ marginBottom: '28px' })}
            {statement(stepType('4xl', headingSizeStep), { maxWidth: '820px' })}
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <BodyWidth slideId={slideId} editable={editable}>{context(stepType('xl', bodySizeStep))}</BodyWidth>
          </div>
        </div>
      </div>
    )
  }

  // D: Statement-led emphasis — oversized statement, context at lower-left
  return (
    <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <SlideBackdrop image={content.backgroundImage} />
      <div className="relative z-10 flex h-full w-full flex-col justify-between px-32 pt-32 pb-28">
        <div className="flex flex-col">
          {label({ marginBottom: '32px' })}
          {statement(stepType('6xl', headingSizeStep), { maxWidth: '1500px' })}
        </div>
        <BodyWidth slideId={slideId} editable={editable}>
          {context(stepType('base', bodySizeStep))}
        </BodyWidth>
      </div>
    </div>
  )
}
