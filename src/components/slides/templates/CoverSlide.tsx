import type { CoverContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { stepType } from '../../../constants/typography'

interface Props {
  content: CoverContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  titleSizeStep?: number
  headingSizeStep?: number
  bodySizeStep?: number
}

const placeholderBlock = (
  <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--color-surface-alt)' }}>
    <svg width="48" height="36" viewBox="0 0 48 36" fill="none" style={{ opacity: 0.2 }}>
      <rect width="48" height="36" rx="3" fill="var(--color-text-muted)" />
    </svg>
  </div>
)

export function CoverSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, titleSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const hasImage = !!content.backgroundImage

  // Reusable editable image dropzone for the full-bleed / column / band variants
  const imageZone = (extraStyle?: React.CSSProperties) => (
    <ImageDropZone
      image={content.backgroundImage}
      onImageDrop={(url) => update(slideId, { backgroundImage: url } as any)}
      onImageRemove={() => update(slideId, { backgroundImage: '' } as any)}
      editable={editable}
      className="h-full w-full"
      style={{ background: content.backgroundImage ? undefined : 'var(--color-surface-alt)', ...extraStyle }}
      imgClassName="h-full w-full object-cover"
      placeholder={placeholderBlock}
      transformKey={`${slideId}:backgroundImage`}
    />
  )

  // Meta line: client · role · year, each individually editable. A middot only
  // appears BETWEEN fields that have content, so emptying one never leaves an
  // orphaned separator. Empty fields stay editable in the editor (so you can
  // re-add them) but are dropped entirely from the rendered/exported output.
  const metaLine = (color: string, mutedColor: string, opts?: { center?: boolean; sizeStep?: number; mutedOpacity?: number }) => {
    const sepStyle: React.CSSProperties = { color: 'var(--color-accent)', fontWeight: 700, padding: '0 6px' }
    const baseStyle: React.CSSProperties = {
      fontFamily: 'var(--font-body)',
      fontSize: stepType('xl', opts?.sizeStep ?? bodySizeStep),
      fontWeight: 500,
      color: mutedColor,
      opacity: opts?.mutedOpacity,
      letterSpacing: '0.01em',
    }
    const isEmpty = (v?: string) => !v || v.replace(/<[^>]*>/g, '').replace(/&nbsp;| /g, ' ').trim() === ''
    const fields = [
      { key: 'client', value: content.client, style: baseStyle },
      { key: 'role', value: content.role, style: baseStyle },
      { key: 'year', value: content.year, style: { ...baseStyle, color } },
    ]
    // Only show fields that have content, joined by separators — no gaps or
    // orphan dots when a field is empty. Emptied fields are re-added from the
    // Cover details panel (Page tab), not an on-canvas slot.
    const shown = fields.filter((f) => !isEmpty(f.value))
    const nodes: React.ReactNode[] = []
    shown.forEach((f, i) => {
      if (i > 0) nodes.push(<span key={`${f.key}-sep`} aria-hidden="true" style={sepStyle}>·</span>)
      nodes.push(
        <EditableText key={f.key} value={f.value ?? ''} onChange={(v) => update(slideId, { [f.key]: v } as any)} as="span" editable={editable} style={f.style} />
      )
    })
    return (
      <div className={`flex flex-wrap items-baseline ${opts?.center ? 'justify-center' : ''}`} style={{ gap: 0 }}>
        {nodes}
      </div>
    )
  }

  // ── A (0): Full-bleed editable background image, title anchored lower-left ──
  if (styleVariant === 0) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: hasImage ? 'var(--color-surface-alt)' : 'var(--color-surface)' }}>
        {hasImage && <div className="absolute inset-0">{imageZone()}</div>}

        {/* Bottom gradient scrim for legibility + footer readability */}
        {hasImage && (
          <div
            className="absolute bottom-0 left-0 right-0 z-[5]"
            style={{ height: '620px', background: 'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.35) 45%, transparent)', pointerEvents: 'none' }}
          />
        )}

        <div className="relative z-10 flex h-full w-full flex-col justify-end px-24 pb-28">
          <EditableText
            value={content.projectName}
            onChange={(v) => update(slideId, { projectName: v } as any)}
            as="h2"
            editable={editable}
            className="mb-7"
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: stepType('7xl', titleSizeStep),
              fontWeight: 900,
              lineHeight: 1.02,
              color: hasImage ? '#ffffff' : 'var(--color-text)',
              maxWidth: '1500px',
              textShadow: hasImage ? '0 2px 30px rgba(0,0,0,0.35)' : undefined,
            }}
          />
          {hasImage
            ? metaLine('#ffffff', 'rgba(255,255,255,0.82)', { sizeStep: bodySizeStep })
            : metaLine('var(--color-text)', 'var(--color-text-muted)')}
        </div>
      </div>
    )
  }

  // ── B (1): Two-column split — text panel left, image right ──
  if (styleVariant === 1) {
    return (
      <div className="relative flex h-[1080px] w-[1920px]" style={{ background: 'var(--color-surface)' }}>
        <div className="flex w-[960px] flex-shrink-0 flex-col justify-center px-24 pb-24">
          <p
            className="mb-8"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: stepType('xs', bodySizeStep),
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
            }}
          >
            Case Study
          </p>
          <EditableText
            value={content.projectName}
            onChange={(v) => update(slideId, { projectName: v } as any)}
            as="h2"
            editable={editable}
            className="mb-9"
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: stepType('6xl', titleSizeStep),
              fontWeight: 900,
              lineHeight: 1.04,
              color: 'var(--color-text)',
              maxWidth: '760px',
            }}
          />
          {metaLine('var(--color-text)', 'var(--color-text-muted)')}
        </div>
        <div className="relative flex-1 overflow-hidden">
          {imageZone()}
        </div>
      </div>
    )
  }

  // ── C (2): Centered, minimal, no image ──
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-col items-center px-24 pb-16">
          <EditableText
            value={content.projectName}
            onChange={(v) => update(slideId, { projectName: v } as any)}
            as="h2"
            editable={editable}
            className="mb-12 text-center"
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: stepType('7xl', titleSizeStep),
              fontWeight: 900,
              lineHeight: 1.02,
              color: 'var(--color-text)',
              maxWidth: '1500px',
            }}
          />
          {metaLine('var(--color-text)', 'var(--color-text-muted)', { center: true })}
        </div>
      </div>
    )
  }

  // ── D (3): Image top band (~60%), text panel beneath ──
  return (
    <div className="relative flex h-[1080px] w-[1920px] flex-col" style={{ background: 'var(--color-surface)' }}>
      <div className="relative w-full overflow-hidden" style={{ height: '648px' }}>
        {imageZone()}
      </div>
      <div className="flex flex-1 flex-col justify-center px-24 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-x-16 gap-y-6">
          <EditableText
            value={content.projectName}
            onChange={(v) => update(slideId, { projectName: v } as any)}
            as="h2"
            editable={editable}
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: stepType('5xl', titleSizeStep),
              fontWeight: 900,
              lineHeight: 1.04,
              color: 'var(--color-text)',
              maxWidth: '1200px',
            }}
          />
          <div className="pb-2">
            {metaLine('var(--color-text)', 'var(--color-text-muted)', { sizeStep: bodySizeStep })}
          </div>
        </div>
      </div>
    </div>
  )
}
