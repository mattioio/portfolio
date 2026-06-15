import type { ShowcaseContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: ShowcaseContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  titleSizeStep?: number
  headingSizeStep?: number
  bodySizeStep?: number
}

const placeholder = (
  <div
    className="flex h-full w-full flex-col items-center justify-center gap-4"
    style={{ background: 'var(--color-surface-alt)' }}
  >
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" style={{ opacity: 0.18 }}>
      <rect x="1" y="1" width="70" height="54" rx="4" fill="var(--color-text)" />
      <circle cx="22" cy="20" r="7" fill="var(--color-surface)" />
      <path d="M2 42 L26 24 L44 36 L70 14 V54 H2 Z" fill="var(--color-surface)" opacity="0.55" />
    </svg>
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: TYPE.sm,
        color: 'var(--color-text-muted)',
        opacity: 0.6,
        letterSpacing: '0.02em',
      }}
    >
      Drop image &middot; 3840 &times; 2160px
    </span>
  </div>
)

export function ShowcaseSlide({ content, slideId, editable = false, styleVariant = 0, darkMode = false, headingSizeStep = 0, bodySizeStep = 0 }: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const imageEl = (radius: string, extraClass = '', extraStyle?: React.CSSProperties) => (
    <ImageDropZone
      image={content.image}
      onImageDrop={(url) => update(slideId, { image: url } as any)}
      onImageRemove={() => update(slideId, { image: '' } as any)}
      editable={editable}
      className={`h-full w-full overflow-hidden ${extraClass}`}
      style={{ borderRadius: radius, ...extraStyle }}
      imgClassName="h-full w-full object-cover"
      placeholder={placeholder}
      transformKey={`${slideId}:image`}
    />
  )

  // ── A (0): Full-bleed image, caption in a bottom-left band over a scrim ──
  if (styleVariant === 0) {
    return (
      <div className="relative h-[1080px] w-[1920px] overflow-hidden" style={{ background: 'var(--color-surface)' }}>
        <div className="absolute inset-0">{imageEl('0')}</div>

        {content.image && (
          <div
            className="absolute bottom-0 left-0 right-0 z-[5] h-[280px]"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)' }}
          />
        )}

        <div className="absolute bottom-0 left-0 z-10 flex items-end px-20 pb-24">
          <div
            className="flex items-center gap-5 px-8 py-5"
            style={{
              background: 'rgba(0,0,0,0.32)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            <div className="h-9 w-[3px] flex-shrink-0" style={{ background: 'var(--color-accent)' }} />
            <EditableText
              value={content.caption}
              onChange={(v) => update(slideId, { caption: v } as any)}
              as="span"
              editable={editable}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: stepType('lg', bodySizeStep),
                fontWeight: 500,
                color: '#ffffff',
                lineHeight: 1.3,
                letterSpacing: '0.01em',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── B (1): Margined image, centered, soft shadow; caption centered below ──
  if (styleVariant === 1) {
    return (
      <div className="relative flex h-[1080px] w-[1920px] flex-col items-center justify-center px-24 pt-20 pb-24" style={{ background: 'var(--color-surface)' }}>
        <div className="w-full max-w-[1500px]" style={{ height: '740px' }}>
          {imageEl('var(--border-radius)', 'shadow-2xl')}
        </div>
        <div className="mt-10 flex w-full max-w-[1100px] flex-col items-center">
          <EditableText
            value={content.caption}
            onChange={(v) => update(slideId, { caption: v } as any)}
            as="p"
            editable={editable}
            multiline
            className="text-center"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: stepType('lg', bodySizeStep),
              fontWeight: 400,
              color: 'var(--color-text)',
              opacity: 0.65,
              lineHeight: 1.5,
            }}
          />
        </div>
      </div>
    )
  }

  // ── C (2): Image fills left two-thirds; caption in right third, centered ──
  if (styleVariant === 2) {
    return (
      <div className="relative flex h-[1080px] w-[1920px]" style={{ background: 'var(--color-surface)' }}>
        <div className="flex-shrink-0 py-16 pl-16" style={{ width: '1240px' }}>
          {imageEl('var(--border-radius)', 'shadow-xl')}
        </div>
        <div className="flex flex-1 flex-col justify-center px-20 pb-20">
          <EditableText
            value={content.caption}
            onChange={(v) => update(slideId, { caption: v } as any)}
            as="p"
            editable={editable}
            multiline
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: stepType('2xl', headingSizeStep),
              fontWeight: 500,
              color: 'var(--color-text)',
              lineHeight: 1.32,
              maxWidth: '480px',
            }}
          />
        </div>
      </div>
    )
  }

  // ── D (3): Device-stage — image on a surface-alt stage, strong shadow; caption beneath ──
  return (
    <div className="relative flex h-[1080px] w-[1920px] flex-col" style={{ background: 'var(--color-surface)' }}>
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: 'var(--color-surface-alt)', padding: '120px 220px 0 220px' }}
      >
        <div
          className="w-full max-w-[1420px]"
          style={{ height: '720px' }}
        >
          {imageEl(
            'var(--border-radius)',
            '',
            { boxShadow: darkMode ? '0 30px 80px rgba(0,0,0,0.55)' : '0 30px 80px rgba(0,0,0,0.28)' },
          )}
        </div>
      </div>
      <div
        className="flex flex-shrink-0 items-center justify-center px-24 pb-24 pt-9"
        style={{ background: 'var(--color-surface-alt)' }}
      >
        <div className="flex items-center gap-5">
          <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: 'var(--color-accent)' }} />
          <EditableText
            value={content.caption}
            onChange={(v) => update(slideId, { caption: v } as any)}
            as="span"
            editable={editable}
            className="text-center"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: stepType('lg', bodySizeStep),
              fontWeight: 500,
              color: 'var(--color-text)',
              opacity: 0.7,
              lineHeight: 1.35,
              letterSpacing: '0.01em',
            }}
          />
        </div>
      </div>
    </div>
  )
}
