import { useRef, useEffect } from 'react'
import type { CVContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: CVContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

const imgPlaceholder = (recWidth: number, recHeight: number) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ background: 'var(--color-surface-alt)' }}>
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none" style={{ opacity: 0.12 }}>
      <rect width="64" height="40" rx="3" fill="var(--color-text)" />
      <circle cx="20" cy="16" r="5" fill="var(--color-surface)" />
      <path d="M0 30 L24 18 L40 26 L64 12 V40 H0Z" fill="var(--color-surface)" opacity="0.5" />
    </svg>
    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', opacity: 0.5 }}>
      {recWidth} &times; {recHeight}px
    </span>
  </div>
)

export function CVSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)
  const isFlipped = styleVariant === 1 || styleVariant === 3

  const roleLabel = (
    <EditableText value={content.roleType} onChange={(v) => update(slideId, { roleType: v } as any)} as="p" editable={editable}
      className="mb-2" style={{ fontFamily: 'var(--font-body)', fontSize: stepType('xs', bodySizeStep), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }} />
  )

  const companyName = content.logo ? (
    <img src={content.logo} alt={content.company} className="mb-5 h-14 w-auto object-contain object-left" />
  ) : (
    <EditableText value={content.company} onChange={(v) => update(slideId, { company: v } as any)} as="h2" editable={editable}
      className="mb-5" style={{ fontFamily: 'var(--font-header)', fontSize: stepType('4xl', headingSizeStep), fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.05 }} />
  )

  const badge = (
    <div className="mb-10 flex items-center gap-2 flex-wrap">
      <EditableText value={content.roleBadge} onChange={(v) => update(slideId, { roleBadge: v } as any)} editable={editable}
        className="inline-block w-fit px-5 py-2" style={{ background: 'var(--color-badge)', color: 'var(--color-badge-text)', borderRadius: 'var(--border-radius)', fontFamily: 'var(--font-body)', fontSize: stepType('sm', bodySizeStep), fontWeight: 600 }} />
      <EditableText value={content.dateRange ?? ''} onChange={(v) => update(slideId, { dateRange: v } as any)} editable={editable}
        className="inline-block w-fit px-5 py-2" style={{ background: 'var(--color-badge)', color: 'var(--color-badge-text)', borderRadius: 'var(--border-radius)', fontFamily: 'var(--font-body)', fontSize: stepType('sm', bodySizeStep), fontWeight: 600 }} />
    </div>
  )

  // Migrate legacy data to HTML bullet lists
  const migrateDescription = (desc: string, bullets: string[]): string => {
    // If there are legacy bullets array entries, convert them to <ul>
    if (bullets?.length) {
      return desc + '<ul>' + bullets.map((b) => `<li>${b}</li>`).join('') + '</ul>'
    }
    // If the description contains raw "- " bullet lines (from earlier broken migration),
    // convert those to proper <ul><li> HTML
    if (/\n- |\n-&nbsp;|^- /.test(desc) && !desc.includes('<li>')) {
      const lines = desc.split(/\n/)
      let html = ''
      let inList = false
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ') || trimmed === '-') {
          if (!inList) { html += '<ul>'; inList = true }
          const text = trimmed.slice(2).trim() || ''
          if (text) html += `<li>${text}</li>`
        } else {
          if (inList) { html += '</ul>'; inList = false }
          if (trimmed) html += `<p>${trimmed}</p>`
        }
      }
      if (inList) html += '</ul>'
      return html
    }
    return desc
  }

  const fullDescription = migrateDescription(content.description, content.bullets ?? [])

  // Persist migration once per slide
  const migratedRef = useRef<string | null>(null)
  useEffect(() => {
    if (migratedRef.current === slideId) return
    if (fullDescription !== content.description || content.bullets?.length) {
      migratedRef.current = slideId
      update(slideId, { description: fullDescription, bullets: [] } as any)
    }
  }, [slideId]) // eslint-disable-line react-hooks/exhaustive-deps

  const bodyContent = (
    <div className="cv-body-content" style={{ maxWidth: '640px' }}>
      <EditableText
        value={fullDescription}
        onChange={(v) => update(slideId, { description: v, bullets: [] } as any)}
        as="div" editable={editable} multiline
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: stepType('lg', bodySizeStep),
          lineHeight: 1.65,
          color: 'var(--color-text)',
        }}
      />
    </div>
  )

  const img = (cls: string, recW = 1200, recH = 2160) => (
    <ImageDropZone image={content.image} onImageDrop={(url) => update(slideId, { image: url } as any)}
      onImageRemove={() => update(slideId, { image: '' } as any)} editable={editable}
      className={cls} style={{ background: 'var(--color-surface-alt)' }} placeholder={imgPlaceholder(recW, recH)}
      transformKey={`${slideId}:image`} />
  )

  // A & B: Classic two-column (B flips image to left)
  if (styleVariant === 0 || styleVariant === 1) {
    return (
      <div className={`relative flex h-[1080px] w-[1920px] ${isFlipped ? 'flex-row-reverse' : ''}`} style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-1 flex-col px-20 py-16">
          <div>{roleLabel}{companyName}{badge}{bodyContent}</div>
        </div>
        {img('w-[600px] flex-shrink-0 overflow-hidden')}
      </div>
    )
  }

  // C: Card-on-background-image — content card over full-bleed bg image
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] items-center justify-center overflow-hidden" style={{ background: 'var(--color-surface-alt)' }}>
        {content.backgroundImage ? (
          <img src={content.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'var(--color-surface-alt)' }} />
        )}
        {/* Bottom gradient scrim for footer readability */}
        <div className="absolute bottom-0 left-0 right-0 h-[120px] z-[5]" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
        <div className="relative z-10 flex overflow-hidden" style={{ width: '1800px', height: '960px', borderRadius: 'var(--border-radius)', background: 'var(--color-surface)' }}>
          <div className="flex flex-1 flex-col p-16">
            <div>{roleLabel}{companyName}{badge}{bodyContent}</div>
          </div>
          <ImageDropZone image={content.image} onImageDrop={(url) => update(slideId, { image: url } as any)}
            onImageRemove={() => update(slideId, { image: '' } as any)} editable={editable}
            className="w-[880px] flex-shrink-0 overflow-hidden" style={{ background: 'var(--color-surface-alt)' }} placeholder={imgPlaceholder(1760, 1920)}
            transformKey={`${slideId}:image`} />
        </div>
      </div>
    )
  }

  // D: No image, text-focused layout
  return (
    <div className="relative flex h-[1080px] w-[1920px] flex-col px-20 py-16" style={{ background: 'var(--color-surface)' }}>
      <div>
        {roleLabel}{companyName}{badge}
        <div className="mt-4">{bodyContent}</div>
      </div>
    </div>
  )
}
