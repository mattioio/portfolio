import type { ReactNode } from 'react'

interface SlideFrameProps {
  children: ReactNode
  scale?: number
  className?: string
}

export function SlideFrame({ children, scale = 1, className = '' }: SlideFrameProps) {
  return (
    <div
      className={className}
      style={{
        width: 1920 * scale,
        height: 1080 * scale,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}
