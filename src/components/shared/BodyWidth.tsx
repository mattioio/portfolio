import { useRef, useState } from 'react'
import { usePortfolioStore } from '../../store/portfolio-store'
import { defaultBodyWidth, BODY_WIDTH_MIN, BODY_WIDTH_MAX } from '../../constants/bodyWidth'

interface Props {
  slideId: string
  editable?: boolean
  /** className applied to the inner content wrapper (e.g. "flex flex-col gap-6") */
  className?: string
  /** Where the block sits, so the drag handle goes on the outward edge. */
  align?: 'left' | 'center'
  style?: React.CSSProperties
  children: React.ReactNode
}

/**
 * Wraps a body-text block and constrains its width to slide.bodyWidth (or the
 * template/variant default). In edit mode it shows a draggable handle on the
 * right edge — drag to re-wrap the copy live; the width is saved per slide.
 * Rendered inside the 1920×1080 slide, so it scales with the canvas; the drag
 * math derives the live scale from the block's on-screen rect.
 */
export function BodyWidth({ slideId, editable = false, className, align = 'left', style, children }: Props) {
  const slide = usePortfolioStore((s) => s.slides.find((sl) => sl.id === slideId))
  const setWidth = usePortfolioStore((s) => s.setSlideBodyWidth)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [dragW, setDragW] = useState<number | null>(null)
  const drag = useRef({ startX: 0, startW: 0, scale: 1 })

  const def = slide ? defaultBodyWidth(slide.type, slide.styleVariant ?? 0) : 760
  const effective = dragW ?? slide?.bodyWidth ?? def

  const onPointerDown = (e: React.PointerEvent) => {
    if (!wrapRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const rect = wrapRef.current.getBoundingClientRect()
    // on-screen px per 1920-space px (the canvas zoom)
    const scale = rect.width > 0 ? rect.width / effective : 1
    drag.current = { startX: e.clientX, startW: effective, scale }
    setDragW(effective)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragW === null) return
    const deltaLayout = (e.clientX - drag.current.startX) / (drag.current.scale || 1)
    const next = Math.round(drag.current.startW + deltaLayout)
    setDragW(Math.max(BODY_WIDTH_MIN, Math.min(BODY_WIDTH_MAX, next)))
  }
  const endDrag = () => {
    if (dragW === null) return
    setWidth(slideId, dragW)
    setDragW(null)
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      style={{ maxWidth: `${effective}px`, width: '100%', ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}), ...style }}
    >
      <div className={className}>{children}</div>

      {editable && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          title="Drag to set text width"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: -16,
            width: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ew-resize',
            zIndex: 40,
            touchAction: 'none',
          }}
        >
          <div
            style={{
              width: 4,
              height: 56,
              borderRadius: 4,
              background: 'var(--color-accent)',
              opacity: dragW !== null ? 1 : 0.55,
              boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-accent) 18%, transparent)',
            }}
          />
        </div>
      )}
    </div>
  )
}
