import type { CaseStudyContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { ArrowRight } from 'lucide-react'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: CaseStudyContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

const placeholderSvg = (
  <div className="flex h-full w-full items-center justify-center" style={{ opacity: 0.2 }}>
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
      <rect width="48" height="36" rx="3" fill="var(--color-text-muted)" />
    </svg>
  </div>
)

export function CaseStudySlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)
  const slides = usePortfolioStore((s) => s.slides)
  const imageSlots = [content.images[0] ?? '', content.images[1] ?? '']
  const isFlipped = styleVariant === 1

  // Auto-number based on position among case-study slides
  const caseStudySlides = slides.filter((s) => s.type === 'case-study')
  const caseStudyIndex = caseStudySlides.findIndex((s) => s.id === slideId)
  const autoNumber = `CASE STUDY #${caseStudyIndex + 1}`

  const textColor = 'var(--color-text)'
  const bgColor = 'var(--color-surface)'

  const label = (
    <p className="mb-6" style={{ fontFamily: 'var(--font-body)', fontSize: stepType('xs', bodySizeStep), fontWeight: 700, letterSpacing: '0.15em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>
      {autoNumber}
    </p>
  )

  const heading = (size: string) => (
    <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
      className="mb-8" style={{ fontFamily: 'var(--font-header)', fontSize: size, fontWeight: 800, lineHeight: 1.06, color: textColor, maxWidth: '600px' }} />
  )

  const description = (
    <EditableText value={content.description} onChange={(v) => update(slideId, { description: v } as any)} as="p" editable={editable} multiline
      className="mb-8" style={{ fontFamily: 'var(--font-body)', fontSize: stepType('lg', bodySizeStep), lineHeight: 1.7, color: textColor, opacity: 0.65, maxWidth: '520px' }} />
  )

  const hasLink = !editable && content.linkUrl

  const linkInner = (
    <div className="flex items-center gap-2">
      <EditableText value={content.linkText} onChange={(v) => update(slideId, { linkText: v } as any)} as="span" editable={editable}
        style={{ fontFamily: 'var(--font-body)', fontSize: stepType('base', bodySizeStep), fontWeight: 500, color: 'var(--color-accent)' }} />
      <ArrowRight size={14} style={{ color: 'var(--color-accent)' }} />
    </div>
  )

  const link = hasLink ? (
    <a href={content.linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      {linkInner}
    </a>
  ) : linkInner

  const imgEl = (img: string, i: number, w: string, h: string, extraStyle?: React.CSSProperties) => (
    <ImageDropZone key={i} image={img}
      onImageDrop={(url) => { const images = [...imageSlots]; images[i] = url; update(slideId, { images } as any) }}
      onImageRemove={() => { const images = [...imageSlots]; images[i] = ''; update(slideId, { images } as any) }}
      editable={editable}
      className="flex items-center justify-center overflow-hidden shadow-xl"
      style={{ width: w, height: h, background: img ? undefined : 'var(--color-surface-alt)', borderRadius: 'var(--border-radius)', ...extraStyle }}
      imgClassName="h-full w-full object-cover" placeholder={placeholderSvg}
      transformKey={`${slideId}:images.${i}`} />
  )

  // A: Content left, single large image right
  if (styleVariant === 0) {
    return (
      <div className="relative flex h-[1080px] w-[1920px]" style={{ background: bgColor }}>
        <div className="flex w-[680px] flex-shrink-0 flex-col justify-center px-20 py-20">
          {label}{heading(stepType('4xl', headingSizeStep))}
          <div className="mb-8 h-[2px] w-14" style={{ background: 'var(--color-accent)' }} />
          {description}{link}
        </div>
        <div className="flex-1 py-16 pr-16">
          {imgEl(imageSlots[0], 0, '100%', '100%')}
        </div>
      </div>
    )
  }

  // B: Flipped — single large image left, content right
  if (styleVariant === 1) {
    return (
      <div className="relative flex h-[1080px] w-[1920px]" style={{ background: bgColor }}>
        <div className="flex-1 py-16 pl-16">
          {imgEl(imageSlots[0], 0, '100%', '100%')}
        </div>
        <div className="flex w-[680px] flex-shrink-0 flex-col justify-center px-20 py-20">
          {label}{heading(stepType('4xl', headingSizeStep))}
          <div className="mb-8 h-[2px] w-14" style={{ background: 'var(--color-accent)' }} />
          {description}{link}
        </div>
      </div>
    )
  }

  // C: Two-column text with image strip across middle
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] flex-col" style={{ background: bgColor }}>
        <div className="flex items-end gap-16 px-20 pt-16 pb-10">
          <div className="flex-1">
            {label}{heading(stepType('3xl', headingSizeStep))}
          </div>
          <div className="flex-1">
            {description}{link}
          </div>
        </div>
        <div className="flex-1 px-20 pb-16">
          {imgEl(imageSlots[0], 0, '100%', '100%')}
        </div>
      </div>
    )
  }

  // D: Full-bleed background image with text overlay card
  return (
    <div className="relative flex h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface-alt)' }}>
      <div className="absolute inset-0">
        {content.backgroundImage ? (
          <img src={content.backgroundImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: 'var(--color-surface-alt)' }} />
        )}
      </div>
      {/* Bottom gradient scrim for footer readability */}
      <div className="absolute bottom-0 left-0 right-0 h-[120px] z-[5]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
      <div className="relative z-10 flex h-full w-full items-end px-20 pb-20">
        <div className="p-14 relative overflow-hidden" style={{
          background: darkMode ? 'var(--color-surface)' : '#ffffff',
          borderRadius: 'var(--border-radius)', maxWidth: '700px',
          boxShadow: darkMode ? 'none' : '0 8px 40px rgba(0,0,0,0.15)',
        }}>
          {label}
          <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
            className="mb-6" style={{ fontFamily: 'var(--font-header)', fontSize: stepType('4xl', headingSizeStep), fontWeight: 800, lineHeight: 1.1, color: 'var(--color-text)' }} />
          <EditableText value={content.description} onChange={(v) => update(slideId, { description: v } as any)} as="p" editable={editable} multiline
            className="mb-6" style={{ fontFamily: 'var(--font-body)', fontSize: stepType('body', bodySizeStep), lineHeight: 1.6, color: 'var(--color-text)', opacity: 0.7 }} />
          {hasLink ? (
            <a href={content.linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'var(--font-body)', fontSize: stepType('sm', bodySizeStep), fontWeight: 500, color: 'var(--color-accent)' }}
                  dangerouslySetInnerHTML={{ __html: content.linkText }} />
                <ArrowRight size={14} style={{ color: 'var(--color-accent)' }} />
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <EditableText value={content.linkText} onChange={(v) => update(slideId, { linkText: v } as any)} as="span" editable={editable}
                style={{ fontFamily: 'var(--font-body)', fontSize: stepType('sm', bodySizeStep), fontWeight: 500, color: 'var(--color-accent)' }} />
              <ArrowRight size={14} style={{ color: 'var(--color-accent)' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
