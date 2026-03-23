import type { SectionTitleContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { ArrowRight } from 'lucide-react'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: SectionTitleContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

export function SectionTitleSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const hasBg = !!content.backgroundImage
  const bgLayer = hasBg ? (
    <>
      <img src={content.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: darkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)' }} />
    </>
  ) : null

  const showBlurb = content.showBlurb ?? false
  const blurbEl = showBlurb ? (
    <EditableText
      value={content.blurb ?? ''}
      onChange={(v) => update(slideId, { blurb: v } as any)}
      as="p"
      editable={editable}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: stepType('lg', bodySizeStep),
        fontWeight: 400,
        color: 'var(--color-text)',
        lineHeight: 1.5,
        opacity: 0.7,
      }}
    />
  ) : null

  const showCta = content.showCta ?? false
  const ctaEl = showCta ? (
    <EditableText
      value={content.ctaLabel ?? 'Learn more'}
      onChange={(v) => update(slideId, { ctaLabel: v } as any)}
      as="span"
      editable={editable}
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-body)',
        fontSize: stepType('base', bodySizeStep),
        fontWeight: 600,
        color: 'var(--color-surface)',
        background: 'var(--color-accent)',
        padding: '14px 36px',
        borderRadius: '8px',
        lineHeight: 1.2,
      }}
    />
  ) : null

  // A: Bottom-left, bold heading + arrow + accent bar
  if (styleVariant === 0) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {bgLayer}
        <div className="relative z-10 flex h-full w-full flex-col justify-end px-20 pb-28">
          <div className="flex items-center gap-8">
            <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
              style={{ fontFamily: 'var(--font-header)', fontSize: stepType('6xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.08, maxWidth: '900px' }} />
            <ArrowRight size={48} style={{ color: 'var(--color-accent)', flexShrink: 0 }} strokeWidth={2} />
          </div>
          {blurbEl && <div className="mt-6" style={{ maxWidth: '700px' }}>{blurbEl}</div>}
          {ctaEl && <div className="mt-8">{ctaEl}</div>}
        </div>
      </div>
    )
  }

  // B: Centered, large, clean
  if (styleVariant === 1) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] items-center justify-center overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {bgLayer}
        <div className="relative z-10 flex flex-col items-center">
          <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
            className="text-center" style={{ fontFamily: 'var(--font-header)', fontSize: TYPE['7xl'], fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.1, maxWidth: '1200px' }} />
          {blurbEl && <div className="mt-6 text-center" style={{ maxWidth: '1100px' }}>{blurbEl}</div>}
          {ctaEl && <div className="mt-10">{ctaEl}</div>}
        </div>
      </div>
    )
  }

  // C: Right-aligned, italic, editorial
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {bgLayer}
        <div className="relative z-10 flex h-full w-full flex-col items-end justify-start px-20 pt-28">
          <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
            style={{ fontFamily: 'var(--font-header)', fontSize: stepType('6xl', headingSizeStep), fontWeight: 400, fontStyle: 'italic', color: 'var(--color-text)', lineHeight: 1.15, maxWidth: '800px', textAlign: 'right' }} />
          <div className="mt-8" style={{ width: '72px', height: '3px', background: 'var(--color-accent)' }} />
          {blurbEl && <div className="mt-6" style={{ textAlign: 'right', maxWidth: '600px' }}>{blurbEl}</div>}
          {ctaEl && <div className="mt-8">{ctaEl}</div>}
        </div>
      </div>
    )
  }

  // D: Full-width uppercase, tracked out, vertically centered with brutalist arrow
  return (
    <div className="relative flex h-[1080px] w-[1920px] items-center overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      {bgLayer}
      <div className="relative z-10 flex w-full flex-col px-20">
        <div className="flex items-center gap-16">
          <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
            style={{ fontFamily: 'var(--font-header)', fontSize: TYPE['7xl'], fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.0 }} />
          <svg width="100" height="100" viewBox="0 0 306.465 310.545" fill="var(--color-text)" style={{ flexShrink: 0 }}>
            <polygon points="149.041,214.822 215.869,147.99 0,147.99 0,100.45 213.774,100.45 146.931,33.6146 180.55,0 306.465,124.628 182.656,248.436" />
          </svg>
        </div>
        {blurbEl && <div className="mt-8" style={{ maxWidth: '800px' }}>{blurbEl}</div>}
        {ctaEl && <div className="mt-8">{ctaEl}</div>}
      </div>
    </div>
  )
}
