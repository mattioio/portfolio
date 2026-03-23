import type { SignOffContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { ExternalLink } from 'lucide-react'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: SignOffContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

export function SignOffSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const headingEl = (size: string, align: string, extra?: React.CSSProperties) => (
    <EditableText value={content.heading} onChange={(v) => update(slideId, { heading: v } as any)} as="h2" editable={editable}
      style={{ fontFamily: 'var(--font-header)', fontSize: size, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.05, textAlign: align as any, ...extra }} />
  )

  const subEl = (size: string, align: string) => (
    <EditableText value={content.subheading} onChange={(v) => update(slideId, { subheading: v } as any)} as="p" editable={editable}
      style={{ fontFamily: 'var(--font-body)', fontSize: size, color: 'var(--color-text)', textAlign: align as any }} />
  )

  const emailEl = (size: string) => {
    const emailText = content.email || ''
    const isEmail = emailText.includes('@')
    const href = isEmail ? `mailto:${emailText}` : emailText

    if (!editable && emailText) {
      return (
        <a href={href} {...(!isEmail ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          style={{ fontFamily: 'var(--font-body)', fontSize: size, color: 'var(--color-accent)', fontWeight: 500, textDecoration: 'none' }}>
          {emailText}
        </a>
      )
    }

    return (
      <EditableText value={emailText} onChange={(v) => update(slideId, { email: v } as any)} as="span" editable={editable}
        style={{ fontFamily: 'var(--font-body)', fontSize: size, color: 'var(--color-accent)', fontWeight: 500 }} />
    )
  }

  const linkPills = (direction: 'row' | 'column' = 'row', isDarkBg = false) => (
    <div className={`flex gap-3 ${direction === 'column' ? 'flex-col' : ''}`}>
      {content.links.map((link, i) => {
        const pillStyle = {
          fontFamily: 'var(--font-body)', fontSize: stepType('base', bodySizeStep), fontWeight: 500,
          color: isDarkBg ? 'var(--color-card-dark-text)' : 'var(--color-text)',
          background: isDarkBg ? 'transparent' : 'var(--color-surface-alt)',
          border: isDarkBg ? '1px solid var(--color-border)' : 'none',
          borderRadius: 'var(--border-radius)',
          textDecoration: 'none',
        }
        const hasUrl = link.url && link.url !== '#'

        if (!editable && hasUrl) {
          return (
            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 transition-opacity hover:opacity-80" style={pillStyle}>
              {link.label}
              <ExternalLink size={12} style={{ opacity: 0.4 }} />
            </a>
          )
        }

        return (
          <div key={i} className="flex items-center gap-2 px-6 py-3" style={pillStyle}>
            <EditableText value={link.label} onChange={(v) => { const links = [...content.links]; links[i] = { ...links[i], label: v }; update(slideId, { links } as any) }} editable={editable} />
            {hasUrl && <ExternalLink size={12} style={{ opacity: 0.4 }} />}
          </div>
        )
      })}
    </div>
  )

  const hasBg = !!content.backgroundImage
  const bgLayer = hasBg ? (
    <>
      <img src={content.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.75)' }} />
    </>
  ) : null

  // When background image is present, use contrasting text
  const textOverride = hasBg && !darkMode ? { color: 'var(--color-text)' } : undefined

  // A: Centered classic
  if (styleVariant === 0) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] flex-col items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        {bgLayer}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6">{headingEl(stepType('5xl', headingSizeStep), 'center')}</div>
          <div className="mb-14">{subEl(stepType('xl', bodySizeStep), 'center')}</div>
          <div className="mb-14">{emailEl(stepType('xl', bodySizeStep))}</div>
          {linkPills()}
        </div>
      </div>
    )
  }

  // B: Left-aligned, stacked
  if (styleVariant === 1) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] flex-col justify-center" style={{ background: 'var(--color-surface)' }}>
        {bgLayer}
        <div className="relative z-10 px-20">
          <div className="mb-6">{headingEl(stepType('5xl', headingSizeStep), 'left')}</div>
          <div className="mb-10">{subEl(stepType('xl', bodySizeStep), 'left')}</div>
          <div className="mb-12">{emailEl(stepType('lg', bodySizeStep))}</div>
          {linkPills()}
        </div>
      </div>
    )
  }

  // C: Two-column — heading left, details right
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] items-center" style={{ background: 'var(--color-surface)' }}>
        {bgLayer}
        <div className="relative z-10 flex w-full items-start gap-20 px-20">
          <div className="flex-1">{headingEl(stepType('5xl', headingSizeStep), 'left')}</div>
          <div className="flex w-[500px] flex-shrink-0 flex-col gap-8 pt-4">
            {subEl(stepType('lg', bodySizeStep), 'left')}
            {emailEl(stepType('lg', bodySizeStep))}
            <div className="h-px" style={{ background: 'var(--color-border)' }} />
            {linkPills('column')}
          </div>
        </div>
      </div>
    )
  }

  // D: Large centered variant
  return (
    <div className="relative flex h-[1080px] w-[1920px] flex-col items-center justify-center" style={{ background: 'var(--color-surface)' }}>
      {bgLayer}
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6">{headingEl(stepType('6xl', headingSizeStep), 'center')}</div>
        <div className="mb-14">{subEl(stepType('xl', bodySizeStep), 'center')}</div>
        <div className="mb-14">{emailEl(stepType('xl', bodySizeStep))}</div>
        {linkPills()}
      </div>
    </div>
  )
}
