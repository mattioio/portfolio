import type { HeroContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { TYPE } from '../../../constants/typography'

interface Props {
  content: HeroContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

export function HeroSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  // When there's a background image, overlay it with a scrim so text remains legible
  const hasImage = !!content.backgroundImage
  const bg = hasImage ? (
    <>
      <img src={content.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {!darkMode && <div className="absolute inset-0 bg-black/40" />}
    </>
  ) : null

  // Text & decorative colors adapt to whether we're on a dark surface
  const onDark = hasImage || darkMode
  const textColor = onDark ? 'var(--color-text-on-dark)' : 'var(--color-text)'
  const ruleOpacity = onDark ? 0.15 : 0.08

  // A: Centered classic
  if (styleVariant === 0) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] items-center justify-center overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {bg}
        <div className="absolute inset-0 z-[1] opacity-[0.03]">
          {[25, 50, 75].map(p => <div key={p} className="absolute top-0 h-full w-px" style={{ left: `${p}%`, background: textColor }} />)}
        </div>
        <EditableText value={content.title} onChange={(v) => update(slideId, { title: v } as any)} as="h1" editable={editable}
          className="relative z-10 text-center" style={{ fontFamily: 'var(--font-header)', fontSize: TYPE['8xl'], fontWeight: 900, lineHeight: 0.88, color: textColor }} />
      </div>
    )
  }

  // B: Split — title left, subtitle right
  if (styleVariant === 1) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {bg}
        <div className="relative z-10 flex h-full w-full items-end px-20 pb-20">
          <EditableText value={content.title} onChange={(v) => update(slideId, { title: v } as any)} as="h1" editable={editable}
            style={{ fontFamily: 'var(--font-header)', fontSize: TYPE['8xl'], lineHeight: 0.85, color: textColor, fontWeight: 800 }} />
        </div>
      </div>
    )
  }

  // C: Oversized type bleeding off edges
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] items-center justify-center overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        {bg}
        <EditableText value={content.title} onChange={(v) => update(slideId, { title: v } as any)} as="h1" editable={editable}
          className="relative z-10 text-center font-black" style={{ fontFamily: 'var(--font-header)', fontSize: TYPE['9xl'], lineHeight: 0.8, color: textColor, opacity: 0.9 }} />
      </div>
    )
  }

  // D: Top-aligned, stacked type with horizontal rule
  return (
    <div className="relative flex h-[1080px] w-[1920px] flex-col overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      {bg}
      <div className="relative z-10 flex flex-1 flex-col px-20 py-20">
        <div className="mb-8 h-px w-full" style={{ background: textColor, opacity: ruleOpacity }} />
        <EditableText value={content.title} onChange={(v) => update(slideId, { title: v } as any)} as="h1" editable={editable}
          style={{ fontFamily: 'var(--font-header)', fontSize: TYPE['7xl'], lineHeight: 0.9, color: textColor, fontWeight: 800 }} />
      </div>
    </div>
  )
}
