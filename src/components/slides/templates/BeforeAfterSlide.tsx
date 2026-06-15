import type { BeforeAfterContent } from '../../../store/types'
import { usePortfolioStore } from '../../../store/portfolio-store'
import { EditableText } from '../../shared/EditableText'
import { ImageDropZone } from '../../shared/ImageDropZone'
import { TYPE, stepType } from '../../../constants/typography'

interface Props {
  content: BeforeAfterContent
  slideId: string
  editable?: boolean
  styleVariant?: number
  darkMode?: boolean
  headingSizeStep?: number
  bodySizeStep?: number
}

const placeholder = (
  <div
    className="flex h-full w-full flex-col items-center justify-center gap-3"
    style={{ background: 'var(--color-surface-alt)' }}
  >
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none" style={{ opacity: 0.14 }}>
      <rect width="64" height="40" rx="3" fill="var(--color-text)" />
      <circle cx="20" cy="16" r="5" fill="var(--color-surface)" />
      <path d="M0 30 L24 18 L40 26 L64 12 V40 H0Z" fill="var(--color-surface)" opacity="0.5" />
    </svg>
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: TYPE.sm,
        color: 'var(--color-text-muted)',
        opacity: 0.55,
        letterSpacing: '0.04em',
      }}
    >
      2560 &times; 2160px
    </span>
  </div>
)

export function BeforeAfterSlide({
  content,
  slideId,
  editable = false,
  styleVariant = 0,
  darkMode = false,
  headingSizeStep = 0,
  bodySizeStep = 0,
}: Props) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const beforeZone = (extraStyle?: React.CSSProperties, radius?: string) => (
    <ImageDropZone
      image={content.beforeImage}
      onImageDrop={(url) => update(slideId, { beforeImage: url } as any)}
      onImageRemove={() => update(slideId, { beforeImage: '' } as any)}
      editable={editable}
      className="h-full w-full overflow-hidden"
      style={{ borderRadius: radius ?? 'var(--border-radius)', ...extraStyle }}
      imgClassName="h-full w-full object-cover"
      placeholder={placeholder}
      transformKey={`${slideId}:beforeImage`}
    />
  )

  const afterZone = (extraStyle?: React.CSSProperties, radius?: string) => (
    <ImageDropZone
      image={content.afterImage}
      onImageDrop={(url) => update(slideId, { afterImage: url } as any)}
      onImageRemove={() => update(slideId, { afterImage: '' } as any)}
      editable={editable}
      className="h-full w-full overflow-hidden"
      style={{ borderRadius: radius ?? 'var(--border-radius)', ...extraStyle }}
      imgClassName="h-full w-full object-cover"
      placeholder={placeholder}
      transformKey={`${slideId}:afterImage`}
    />
  )

  const headingEl = (size: string, align: 'left' | 'center' = 'center') => (
    <EditableText
      value={content.heading}
      onChange={(v) => update(slideId, { heading: v } as any)}
      as="h2"
      editable={editable}
      style={{
        fontFamily: 'var(--font-header)',
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.08,
        color: 'var(--color-text)',
        textAlign: align,
      }}
    />
  )

  // ── A (0): two equal images side by side, label as chip top-left of each ──
  if (styleVariant === 0) {
    const chip = (field: 'beforeLabel' | 'afterLabel', accent: boolean) => (
      <div
        className="absolute left-6 top-6 z-10"
        style={{
          background: accent ? 'var(--color-accent)' : 'rgba(0,0,0,0.72)',
          borderRadius: '999px',
          padding: '8px 18px',
          backdropFilter: 'blur(4px)',
        }}
      >
        <EditableText
          value={content[field]}
          onChange={(v) => update(slideId, { [field]: v } as any)}
          as="span"
          editable={editable}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: stepType('sm', bodySizeStep),
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#ffffff',
          }}
        />
      </div>
    )

    return (
      <div
        className="relative flex h-[1080px] w-[1920px]"
        style={{ background: 'var(--color-surface)', padding: '24px', paddingBottom: '88px', gap: '24px' }}
      >
        <div className="relative flex-1">
          {chip('beforeLabel', false)}
          {beforeZone()}
        </div>
        <div className="relative flex-1">
          {chip('afterLabel', true)}
          {afterZone()}
        </div>
      </div>
    )
  }

  // ── B (1): heading top-center, two images below, centered muted labels under each ──
  if (styleVariant === 1) {
    const captionLabel = (field: 'beforeLabel' | 'afterLabel') => (
      <EditableText
        value={content[field]}
        onChange={(v) => update(slideId, { [field]: v } as any)}
        as="span"
        editable={editable}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: stepType('sm', bodySizeStep),
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      />
    )

    return (
      <div
        className="relative flex h-[1080px] w-[1920px] flex-col"
        style={{ background: 'var(--color-surface)', padding: '72px 80px 88px' }}
      >
        <div className="mb-10 flex flex-col items-center">
          {headingEl(stepType('4xl', headingSizeStep), 'center')}
          <div className="mt-6 h-[3px] w-16" style={{ background: 'var(--color-accent)' }} />
        </div>
        <div className="flex flex-1 gap-12">
          <div className="flex flex-1 flex-col">
            <div className="flex-1">{beforeZone()}</div>
            <div className="mt-5 text-center">{captionLabel('beforeLabel')}</div>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex-1">{afterZone()}</div>
            <div className="mt-5 text-center">{captionLabel('afterLabel')}</div>
          </div>
        </div>
      </div>
    )
  }

  // ── C (2): stacked rows, before on top / after below, labels to the left of each row ──
  if (styleVariant === 2) {
    const rowLabel = (field: 'beforeLabel' | 'afterLabel', index: string) => (
      <div className="flex w-[300px] flex-shrink-0 flex-col justify-center pr-12">
        <span
          style={{
            fontFamily: 'var(--font-header)',
            fontSize: stepType('2xl', headingSizeStep),
            fontWeight: 800,
            color: 'var(--color-accent)',
            lineHeight: 1,
          }}
        >
          {index}
        </span>
        <EditableText
          value={content[field]}
          onChange={(v) => update(slideId, { [field]: v } as any)}
          as="span"
          editable={editable}
          className="mt-3"
          style={{
            fontFamily: 'var(--font-header)',
            fontSize: stepType('3xl', headingSizeStep),
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
            lineHeight: 1.05,
          }}
        />
      </div>
    )

    return (
      <div
        className="relative flex h-[1080px] w-[1920px] flex-col"
        style={{ background: 'var(--color-surface)', padding: '64px 80px 96px', gap: '36px' }}
      >
        <div className="flex flex-1 items-stretch">
          {rowLabel('beforeLabel', '01')}
          <div className="flex-1">{beforeZone()}</div>
        </div>
        <div className="flex flex-1 items-stretch">
          {rowLabel('afterLabel', '02')}
          <div className="flex-1">{afterZone()}</div>
        </div>
      </div>
    )
  }

  // ── D (3): two images side by side with thin vertical accent divider, large labels beneath ──
  const bigLabel = (field: 'beforeLabel' | 'afterLabel') => (
    <EditableText
      value={content[field]}
      onChange={(v) => update(slideId, { [field]: v } as any)}
      as="span"
      editable={editable}
      style={{
        fontFamily: 'var(--font-header)',
        fontSize: stepType('2xl', headingSizeStep),
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: 'var(--color-text)',
      }}
    />
  )

  return (
    <div
      className="relative flex h-[1080px] w-[1920px] flex-col"
      style={{ background: 'var(--color-surface)', padding: '80px 96px 96px' }}
    >
      <div className="flex flex-1 items-stretch" style={{ gap: '48px' }}>
        <div className="flex flex-1 flex-col">
          <div className="flex-1">{beforeZone()}</div>
          <div className="mt-7 text-center">{bigLabel('beforeLabel')}</div>
        </div>
        <div className="flex-shrink-0 self-stretch" style={{ width: '2px', background: 'var(--color-accent)' }} />
        <div className="flex flex-1 flex-col">
          <div className="flex-1">{afterZone()}</div>
          <div className="mt-7 text-center">{bigLabel('afterLabel')}</div>
        </div>
      </div>
    </div>
  )
}
