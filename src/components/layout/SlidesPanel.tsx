import { memo, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, Copy } from 'lucide-react'
import { usePortfolioStore } from '../../store/portfolio-store'
import type { Slide } from '../../store/types'
import { SlideFrame } from '../slides/SlideFrame'
import { SlideRenderer } from '../slides/SlideRenderer'
import { DragHandle } from '../shared/DragHandle'

const THUMB_SCALE = 0.108
const THUMB_H = 125 // approximate height of a thumbnail row in px

/** Skeleton placeholder matching thumbnail dimensions */
function ThumbSkeleton({ index, isSelected }: { index: number; isSelected: boolean }) {
  return (
    <div className="group relative">
      <div className="flex items-start gap-1">
        <div className="mt-2 w-4" />
        <div className="flex-1">
          <div
            className={`w-full rounded-lg border-2 ${
              isSelected ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <div
              className="overflow-hidden rounded-md bg-zinc-800/50 animate-pulse"
              style={{ height: `${1080 * THUMB_SCALE}px` }}
            />
          </div>
          <div className="flex items-center px-0.5 pt-0.5">
            <span className="text-[10px] text-zinc-500">{index + 1}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const SortableSlide = memo(function SortableSlide({
  slide,
  index,
  isSelected,
  ready,
}: {
  slide: Slide
  index: number
  isSelected: boolean
  ready: boolean
}) {
  const selectSlide = usePortfolioStore((s) => s.selectSlide)
  const removeSlide = usePortfolioStore((s) => s.removeSlide)
  const duplicateSlide = usePortfolioStore((s) => s.duplicateSlide)
  const itemRef = useRef<HTMLDivElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id })

  // Scroll the selected slide into view when selected
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isSelected])

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    contentVisibility: 'auto',
    containIntrinsicSize: `0 ${THUMB_H}px`,
  }

  return (
    <div ref={(node) => { setNodeRef(node); (itemRef as any).current = node }} style={style} className="group relative">
      <div className="flex items-start gap-1">
        <div className="mt-2">
          <DragHandle attributes={attributes} listeners={listeners} />
        </div>
        <div className="flex-1">
          <button
            onClick={() => selectSlide(slide.id)}
            className={`w-full text-left rounded-lg border-2 transition-colors ${
              isSelected
                ? 'border-blue-500'
                : 'border-transparent hover:border-zinc-600'
            }`}
          >
            <div className="overflow-hidden rounded-md">
              {ready ? (
                <SlideFrame scale={THUMB_SCALE}>
                  <SlideRenderer slide={slide} />
                </SlideFrame>
              ) : (
                <div
                  className="bg-zinc-800/50 animate-pulse"
                  style={{ height: `${1080 * THUMB_SCALE}px` }}
                />
              )}
            </div>
          </button>
          <div className="flex items-center justify-between px-0.5 pt-0.5">
            <span className="text-[10px] text-zinc-500">{index + 1}</span>
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => duplicateSlide(slide.id)}
                className="rounded p-0.5 text-zinc-600 hover:text-zinc-300"
                title="Duplicate"
                aria-label="Duplicate slide"
              >
                <Copy size={10} />
              </button>
              <button
                onClick={() => removeSlide(slide.id)}
                className="rounded p-0.5 text-zinc-600 hover:text-red-400"
                title="Delete"
                aria-label="Delete slide"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export function SlidesPanel() {
  const slides = usePortfolioStore((s) => s.slides)
  const selectedSlideId = usePortfolioStore((s) => s.selectedSlideId)
  const reorderSlides = usePortfolioStore((s) => s.reorderSlides)
  // Progressive rendering: show skeletons first, hydrate thumbnails in batches
  const [renderedCount, setRenderedCount] = useState(0)
  const batchSize = 4

  useEffect(() => {
    if (renderedCount >= slides.length) return
    // Use requestAnimationFrame to yield to the browser between batches
    const raf = requestAnimationFrame(() => {
      setRenderedCount((c) => Math.min(c + batchSize, slides.length))
    })
    return () => cancelAnimationFrame(raf)
  }, [renderedCount, slides.length])

  // Reset when slides change (new slide added, etc)
  const prevLenRef = useRef(slides.length)
  useEffect(() => {
    if (slides.length !== prevLenRef.current) {
      // If slides were added/removed, render all immediately (they're already cached)
      setRenderedCount(slides.length)
      prevLenRef.current = slides.length
    }
  }, [slides.length])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderSlides(active.id as string, over.id as string)
    }
  }

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-xs text-zinc-500">No slides yet</p>
        <p className="text-[10px] text-zinc-600">
          Add slides from the templates below
        </p>
      </div>
    )
  }

  return (
    <div className="sidebar-scroll flex flex-col gap-2 overflow-y-auto p-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slides.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {slides.map((slide, i) => (
            <SortableSlide
              key={slide.id}
              slide={slide}
              index={i}
              isSelected={slide.id === selectedSlideId}
              ready={i < renderedCount}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
