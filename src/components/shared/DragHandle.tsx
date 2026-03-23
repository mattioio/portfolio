import { GripVertical } from 'lucide-react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

interface DragHandleProps {
  attributes: DraggableAttributes
  listeners: SyntheticListenerMap | undefined
}

export function DragHandle({ attributes, listeners }: DragHandleProps) {
  return (
    <button
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none rounded p-0.5 text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      <GripVertical size={12} />
    </button>
  )
}
