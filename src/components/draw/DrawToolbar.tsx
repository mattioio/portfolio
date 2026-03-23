import { useEffect, useRef, useState } from 'react'
import { Pencil, Eraser, Hand, Shapes } from 'lucide-react'
import { usePortfolioStore } from '../../store/portfolio-store'

const SIZES = [
  { value: 3, size: 6, shortcut: 'A' },
  { value: 6, size: 10, shortcut: 'S' },
  { value: 12, size: 16, shortcut: 'D' },
]

const COLORS = [
  { key: 'text', label: 'Black', shortcut: 'Z', bg: 'var(--color-text)' },
  { key: 'background', label: 'White', shortcut: 'X', bg: 'var(--color-background)', border: true },
  { key: 'accent', label: 'Accent', shortcut: 'C', bg: 'var(--color-accent)' },
]

const SHAPE_TYPES = [
  { key: 'circle', label: 'Circle' },
  { key: 'square', label: 'Square' },
  { key: 'triangle', label: 'Triangle' },
  { key: 'diamond', label: 'Diamond' },
  { key: 'star', label: 'Star' },
  { key: 'cross', label: 'Cross' },
  { key: 'zigzag', label: 'Zigzag' },
]

/** Custom styled tooltip */
function Tip({ label, shortcut, hint, children }: {
  label: string
  shortcut?: string
  hint?: string
  children: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 400)
  }
  const handleLeave = () => {
    clearTimeout(timeoutRef.current)
    setShow(false)
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {show && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap">
          <div className="rounded-lg bg-zinc-900 px-2.5 py-1.5 shadow-lg" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-white">{label}</span>
              {shortcut && (
                <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">{shortcut}</span>
              )}
            </div>
            {hint && (
              <p className="mt-0.5 text-[10px] text-zinc-500">{hint}</p>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  )
}

/** Mini SVG preview for each shape type */
function ShapeIcon({ shape, filled, size = 16 }: { shape: string; filled: boolean; size?: number }) {
  const s = size
  const half = s / 2
  const stroke = 'currentColor'
  const fill = filled ? 'currentColor' : 'none'
  const sw = 1.5

  switch (shape) {
    case 'circle':
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><circle cx={half} cy={half} r={half - 2} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>
    case 'square':
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={2} y={2} width={s - 4} height={s - 4} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>
    case 'triangle':
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={`${half},2 ${s - 2},${s - 2} 2,${s - 2}`} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>
    case 'diamond':
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={`${half},1 ${s - 1},${half} ${half},${s - 1} 1,${half}`} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>
    case 'star': {
      const pts: string[] = []
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * Math.PI / 180
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180
        pts.push(`${half + (half - 1) * Math.cos(outerAngle)},${half + (half - 1) * Math.sin(outerAngle)}`)
        pts.push(`${half + (half - 4) * Math.cos(innerAngle)},${half + (half - 4) * Math.sin(innerAngle)}`)
      }
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts.join(' ')} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>
    }
    case 'cross':
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polygon points={`${s * 0.35},1 ${s * 0.65},1 ${s * 0.65},${s * 0.35} ${s - 1},${s * 0.35} ${s - 1},${s * 0.65} ${s * 0.65},${s * 0.65} ${s * 0.65},${s - 1} ${s * 0.35},${s - 1} ${s * 0.35},${s * 0.65} 1,${s * 0.65} 1,${s * 0.35} ${s * 0.35},${s * 0.35}`} fill={fill} stroke={stroke} strokeWidth={sw} />
      </svg>
    case 'zigzag':
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <polyline points={`2,${s * 0.25} ${s * 0.33},${s * 0.75} ${s * 0.66},${s * 0.25} ${s - 2},${s * 0.75}`} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    default:
      return null
  }
}

function ShapePicker({ onClose }: { onClose: () => void }) {
  const shapeType = usePortfolioStore((s) => s.drawShapeType)
  const shapeFilled = usePortfolioStore((s) => s.drawShapeFilled)
  const setShapeType = usePortfolioStore((s) => s.setDrawShapeType)
  const setShapeFilled = usePortfolioStore((s) => s.setDrawShapeFilled)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 rounded-xl bg-white/95 p-2.5 shadow-2xl backdrop-blur-sm"
      style={{ border: '1px solid rgba(0,0,0,0.08)', minWidth: 180 }}>

      {/* Fill toggle */}
      <div className="mb-2 flex gap-1">
        <button
          onClick={() => setShapeFilled(true)}
          className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
            shapeFilled ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Filled
        </button>
        <button
          onClick={() => setShapeFilled(false)}
          className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
            !shapeFilled ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Outline
        </button>
      </div>

      {/* Shape grid */}
      <div className="grid grid-cols-4 gap-1">
        {SHAPE_TYPES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setShapeType(key); onClose() }}
            className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
              shapeType === key ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'
            }`}
            title={label}
          >
            <ShapeIcon shape={key} filled={shapeFilled} size={20} />
            <span className="text-[9px]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function DrawToolbar() {
  const tool = usePortfolioStore((s) => s.drawTool)
  const setTool = usePortfolioStore((s) => s.setDrawTool)
  const strokeWidth = usePortfolioStore((s) => s.drawStrokeWidth)
  const setStrokeWidth = usePortfolioStore((s) => s.setDrawStrokeWidth)
  const strokeColor = usePortfolioStore((s) => s.drawStrokeColor)
  const setStrokeColor = usePortfolioStore((s) => s.setDrawStrokeColor)
  const recolorLayer = usePortfolioStore((s) => s.recolorDrawingLayer)
  const restrokeLayer = usePortfolioStore((s) => s.restrokeDrawingLayer)
  const selectedSlideId = usePortfolioStore((s) => s.selectedSlideId)
  const selectedLayerIds = usePortfolioStore((s) => s.selectedDrawingLayerIds)
  const shapeType = usePortfolioStore((s) => s.drawShapeType)
  const shapeFilled = usePortfolioStore((s) => s.drawShapeFilled)
  const prevToolRef = useRef(tool)
  const showShapePicker = usePortfolioStore((s) => s.drawShapePickerOpen)
  const setShowShapePicker = usePortfolioStore((s) => s.setDrawShapePickerOpen)

  // Space: hold = temporary hand tool, double-tap = lock hand tool
  const lastSpaceDownRef = useRef(0)
  const spaceHeldRef = useRef(false)
  const doubleTapLocked = useRef(false)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.repeat) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      e.preventDefault()

      const now = Date.now()
      const gap = now - lastSpaceDownRef.current
      lastSpaceDownRef.current = now

      if (gap < 300 && tool === 'hand') {
        // Double-tap: lock into hand mode
        doubleTapLocked.current = true
        return
      }

      if (tool !== 'hand') {
        prevToolRef.current = tool
        setTool('hand')
        spaceHeldRef.current = true
        doubleTapLocked.current = false
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key !== ' ') return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      e.preventDefault()

      if (doubleTapLocked.current) return // stay in hand mode
      if (spaceHeldRef.current) {
        spaceHeldRef.current = false
        setTool(prevToolRef.current === 'hand' ? 'pen' : prevToolRef.current)
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [tool, setTool])

  useEffect(() => {
    if (tool !== 'hand') prevToolRef.current = tool
  }, [tool])

  return (
    <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl bg-white/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
        style={{ border: '1px solid rgba(0,0,0,0.08)' }}>

        {/* Tools */}
        <Tip label="Pen" shortcut="Q">
          <button
            onClick={() => setTool('pen')}
            className={`rounded-xl p-2.5 transition-colors ${
              tool === 'pen' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            }`}
          >
            <Pencil size={18} />
          </button>
        </Tip>

        <Tip label="Eraser" shortcut="W">
          <button
            onClick={() => setTool('eraser')}
            className={`rounded-xl p-2.5 transition-colors ${
              tool === 'eraser' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            }`}
          >
            <Eraser size={18} />
          </button>
        </Tip>

        <Tip label="Move" shortcut="E" hint="Hold Space for quick access">
          <button
            onClick={() => setTool('hand')}
            className={`rounded-xl p-2.5 transition-colors ${
              tool === 'hand' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            }`}
          >
            <Hand size={18} />
          </button>
        </Tip>

        {/* Shape tool */}
        <div className="relative">
          <Tip label="Shapes" shortcut="R">
            <button
              onClick={() => {
                if (tool === 'shape') {
                  setShowShapePicker((v) => !v)
                } else {
                  setTool('shape')
                }
              }}
              className={`rounded-xl p-2.5 transition-colors ${
                tool === 'shape' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
              }`}
            >
              <ShapeIcon shape={shapeType} filled={shapeFilled} size={18} />
            </button>
          </Tip>
          {showShapePicker && <ShapePicker onClose={() => setShowShapePicker(false)} />}
        </div>

        {/* Divider */}
        <div className="mx-1.5 h-6 w-px bg-zinc-200" />

        {/* Stroke sizes */}
        <div className="flex items-center gap-1.5 px-1">
          {SIZES.map(({ value, size, shortcut }) => (
            <Tip key={value} label={`${value}px`} shortcut={shortcut} hint="Double-click to apply to layer">
              <button
                onClick={() => setStrokeWidth(value)}
                onDoubleClick={() => {
                  if (selectedSlideId && selectedLayerIds.length > 0) {
                    for (const lid of selectedLayerIds) {
                      restrokeLayer(selectedSlideId, lid, value)
                    }
                  }
                }}
                className={`flex items-center justify-center rounded-full transition-all ${
                  strokeWidth === value ? 'ring-2 ring-zinc-400 ring-offset-1' : 'hover:bg-zinc-100'
                }`}
                style={{ width: 28, height: 28 }}
              >
                <div
                  className="rounded-full bg-zinc-800"
                  style={{ width: size, height: size }}
                />
              </button>
            </Tip>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-1.5 h-6 w-px bg-zinc-200" />

        {/* Colors */}
        <div className="flex items-center gap-1.5 px-1">
          {COLORS.map(({ key, label, shortcut, bg, border }) => (
            <Tip key={key} label={label} shortcut={shortcut} hint="Double-click to apply to layer">
              <button
                onClick={() => setStrokeColor(key)}
                onDoubleClick={() => {
                  if (selectedSlideId && selectedLayerIds.length > 0) {
                    for (const lid of selectedLayerIds) {
                      recolorLayer(selectedSlideId, lid, key)
                    }
                  }
                }}
                className={`rounded-full transition-all ${
                  strokeColor === key ? 'ring-2 ring-zinc-400 ring-offset-2' : 'hover:scale-110'
                }`}
                style={{
                  width: 24,
                  height: 24,
                  background: bg,
                  border: border ? '1.5px solid rgba(0,0,0,0.15)' : 'none',
                }}
              />
            </Tip>
          ))}
        </div>
      </div>
    </div>
  )
}
