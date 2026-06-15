import type { ProblemContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { stepType } from '../../../constants/typography'

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

  const rule = (extraStyle?: React.CSSProperties) => (
    <div style={{ height: '3px', width: '64px', background: 'var(--color-accent)', ...extraStyle }} />
  )

  // A: Left-aligned, vertically centered
  if (styleVariant === 0) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] flex-col justify-center px-32 pb-24" style={{ background: 'var(--color-surface)' }}>
        {label({ marginBottom: '28px' })}
        {statement(stepType('5xl', headingSizeStep), { maxWidth: '1200px' })}
        {rule({ margin: '44px 0' })}
        {context(stepType('lg', bodySizeStep), { maxWidth: '720px' })}
      </div>
    )
  }

  // B: Centered version of A
  if (styleVariant === 1) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] flex-col items-center justify-center px-32 pb-24 text-center" style={{ background: 'var(--color-surface)' }}>
        {label({ marginBottom: '28px' })}
        {statement(stepType('5xl', headingSizeStep), { maxWidth: '1100px' })}
        {rule({ margin: '44px 0' })}
        {context(stepType('lg', bodySizeStep), { maxWidth: '720px' })}
      </div>
    )
  }

  // C: Two-column — statement left, context right
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] items-center gap-24 px-32 pb-24" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-1 flex-col">
          {label({ marginBottom: '28px' })}
          {statement(stepType('4xl', headingSizeStep), { maxWidth: '820px' })}
          {rule({ marginTop: '44px' })}
        </div>
        <div className="flex flex-1 flex-col justify-center" style={{ maxWidth: '680px' }}>
          {context(stepType('xl', bodySizeStep))}
        </div>
      </div>
    )
  }

  // D: Statement-led emphasis — oversized statement, context at lower-left
  return (
    <div className="relative flex h-[1080px] w-[1920px] flex-col justify-between px-32 pt-32 pb-28" style={{ background: 'var(--color-surface)' }}>
      <div className="flex flex-col">
        {label({ marginBottom: '32px' })}
        {rule({ marginBottom: '40px', height: '5px', width: '96px' })}
        {statement(stepType('6xl', headingSizeStep), { maxWidth: '1500px' })}
      </div>
      <div style={{ maxWidth: '640px' }}>
        {context(stepType('base', bodySizeStep))}
      </div>
    </div>
  )
}
