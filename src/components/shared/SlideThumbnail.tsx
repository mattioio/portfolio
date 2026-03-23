import type { Slide } from '../../store/types'
import { SlideFrame } from '../slides/SlideFrame'
import { SlideRenderer } from '../slides/SlideRenderer'

interface SlideThumbnailProps {
  slide: Slide
  isSelected: boolean
  index: number
  onClick: () => void
}

const THUMB_SCALE = 0.115

export function SlideThumbnail({
  slide,
  isSelected,
  index,
  onClick,
}: SlideThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-lg border-2 transition-colors ${
        isSelected
          ? 'border-blue-500'
          : 'border-transparent hover:border-zinc-600'
      }`}
    >
      <div className="overflow-hidden rounded-md">
        <SlideFrame scale={THUMB_SCALE}>
          <SlideRenderer slide={slide} />
        </SlideFrame>
      </div>
      <span className="absolute bottom-1 left-1.5 text-[10px] text-zinc-500">
        {index + 1}
      </span>
    </button>
  )
}
