import { useRef, useState, useCallback, useMemo } from 'react'
import { usePortfolioStore } from '../../store/portfolio-store'
import type { DrawingPath, DrawingLayer } from '../../store/types'

const COLOR_MAP: Record<string, string> = {
  text: 'var(--color-text)',
  background: 'var(--color-background)',
  accent: 'var(--color-accent)',
}

/** Generate SVG path `d` string for a shape within a bounding box */
function generateShapePath(shape: string, x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2
  const cy = y + h / 2
  const rx = w / 2
  const ry = h / 2

  switch (shape) {
    case 'circle': {
      // Ellipse as two arcs
      return `M ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy} A ${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`
    }
    case 'square':
      return `M ${x},${y} L ${x + w},${y} L ${x + w},${y + h} L ${x},${y + h} Z`
    case 'triangle':
      return `M ${cx},${y} L ${x + w},${y + h} L ${x},${y + h} Z`
    case 'diamond':
      return `M ${cx},${y} L ${x + w},${cy} L ${cx},${y + h} L ${x},${cy} Z`
    case 'star': {
      const pts: string[] = []
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * Math.PI / 180
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180
        pts.push(`${cx + rx * Math.cos(outerAngle)},${cy + ry * Math.sin(outerAngle)}`)
        pts.push(`${cx + rx * 0.4 * Math.cos(innerAngle)},${cy + ry * 0.4 * Math.sin(innerAngle)}`)
      }
      return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`
    }
    case 'cross': {
      const t = 0.3 // thickness ratio
      const x1 = x, x2 = x + w * t, x3 = x + w * (1 - t), x4 = x + w
      const y1 = y, y2 = y + h * t, y3 = y + h * (1 - t), y4 = y + h
      return `M ${x2},${y1} L ${x3},${y1} L ${x3},${y2} L ${x4},${y2} L ${x4},${y3} L ${x3},${y3} L ${x3},${y4} L ${x2},${y4} L ${x2},${y3} L ${x1},${y3} L ${x1},${y2} L ${x2},${y2} Z`
    }
    case 'zigzag': {
      const segments = 4
      const segW = w / segments
      const pts: string[] = [`${x},${cy}`]
      for (let i = 0; i < segments; i++) {
        const px = x + (i + 0.5) * segW
        const py = i % 2 === 0 ? y : y + h
        pts.push(`${px},${py}`)
      }
      pts.push(`${x + w},${cy}`)
      return `M ${pts.join(' L ')}`
    }
    default:
      return `M ${x},${y} L ${x + w},${y} L ${x + w},${y + h} L ${x},${y + h} Z`
  }
}

interface Props {
  slideId: string
  interactive?: boolean
}

/** Convert an array of points into a smooth SVG path using quadratic beziers */
function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x},${points[0].y} L ${points[0].x},${points[0].y}`
  if (points.length === 2) return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`

  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    d += ` Q ${points[i].x},${points[i].y} ${midX},${midY}`
  }
  const last = points[points.length - 1]
  d += ` L ${last.x},${last.y}`
  return d
}

/** Simplify points using distance-based reduction */
function simplifyPoints(points: { x: number; y: number }[], tolerance: number = 2): { x: number; y: number }[] {
  if (points.length <= 2) return points
  const result = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1]
    const dx = points[i].x - prev.x
    const dy = points[i].y - prev.y
    if (dx * dx + dy * dy > tolerance * tolerance) {
      result.push(points[i])
    }
  }
  result.push(points[points.length - 1])
  return result
}

/** Extract actual coordinate points from an SVG path `d` string, handling all commands correctly */
function extractPathCoords(d: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  // Split into commands: letter followed by numbers/commas/spaces
  const commands = d.match(/[MLHVCSQTAZmlhvcsqtaz][^MLHVCSQTAZmlhvcsqtaz]*/g)
  if (!commands) return points

  let cx = 0, cy = 0 // current position

  for (const cmd of commands) {
    const type = cmd[0]
    const nums = cmd.slice(1).match(/-?\d+\.?\d*/g)?.map(Number) ?? []

    switch (type) {
      case 'M': case 'L': case 'T':
        for (let i = 0; i < nums.length; i += 2) {
          cx = nums[i]; cy = nums[i + 1]
          points.push({ x: cx, y: cy })
        }
        break
      case 'm': case 'l': case 't':
        for (let i = 0; i < nums.length; i += 2) {
          cx += nums[i]; cy += nums[i + 1]
          points.push({ x: cx, y: cy })
        }
        break
      case 'H':
        for (const n of nums) { cx = n; points.push({ x: cx, y: cy }) }
        break
      case 'h':
        for (const n of nums) { cx += n; points.push({ x: cx, y: cy }) }
        break
      case 'V':
        for (const n of nums) { cy = n; points.push({ x: cx, y: cy }) }
        break
      case 'v':
        for (const n of nums) { cy += n; points.push({ x: cx, y: cy }) }
        break
      case 'Q':
        // quadratic: cx1,cy1 x,y
        for (let i = 0; i < nums.length; i += 4) {
          points.push({ x: nums[i], y: nums[i + 1] }) // control point
          cx = nums[i + 2]; cy = nums[i + 3]
          points.push({ x: cx, y: cy })
        }
        break
      case 'q':
        for (let i = 0; i < nums.length; i += 4) {
          points.push({ x: cx + nums[i], y: cy + nums[i + 1] })
          cx += nums[i + 2]; cy += nums[i + 3]
          points.push({ x: cx, y: cy })
        }
        break
      case 'C':
        // cubic: cx1,cy1 cx2,cy2 x,y
        for (let i = 0; i < nums.length; i += 6) {
          points.push({ x: nums[i], y: nums[i + 1] })
          points.push({ x: nums[i + 2], y: nums[i + 3] })
          cx = nums[i + 4]; cy = nums[i + 5]
          points.push({ x: cx, y: cy })
        }
        break
      case 'c':
        for (let i = 0; i < nums.length; i += 6) {
          points.push({ x: cx + nums[i], y: cy + nums[i + 1] })
          points.push({ x: cx + nums[i + 2], y: cy + nums[i + 3] })
          cx += nums[i + 4]; cy += nums[i + 5]
          points.push({ x: cx, y: cy })
        }
        break
      case 'S':
        for (let i = 0; i < nums.length; i += 4) {
          points.push({ x: nums[i], y: nums[i + 1] })
          cx = nums[i + 2]; cy = nums[i + 3]
          points.push({ x: cx, y: cy })
        }
        break
      case 's':
        for (let i = 0; i < nums.length; i += 4) {
          points.push({ x: cx + nums[i], y: cy + nums[i + 1] })
          cx += nums[i + 2]; cy += nums[i + 3]
          points.push({ x: cx, y: cy })
        }
        break
      case 'A':
        // arc: rx ry x-rotation large-arc sweep x y — only last 2 are coords
        for (let i = 0; i < nums.length; i += 7) {
          cx = nums[i + 5]; cy = nums[i + 6]
          points.push({ x: cx, y: cy })
          // Also include arc extents: center ± rx/ry as rough bounds
          const rx = nums[i], ry = nums[i + 1]
          points.push({ x: cx - rx, y: cy - ry })
          points.push({ x: cx + rx, y: cy + ry })
        }
        break
      case 'a':
        for (let i = 0; i < nums.length; i += 7) {
          cx += nums[i + 5]; cy += nums[i + 6]
          points.push({ x: cx, y: cy })
          const rx = nums[i], ry = nums[i + 1]
          points.push({ x: cx - rx, y: cy - ry })
          points.push({ x: cx + rx, y: cy + ry })
        }
        break
      case 'Z': case 'z':
        break
    }
  }
  return points
}

/** Calculate tight bounding box for all paths in a layer */
// Shared off-screen SVG for accurate getBBox calculations
let _boundsNS: SVGSVGElement | null = null
let _boundsPath: SVGPathElement | null = null
function getSVGBoundsEls() {
  if (!_boundsNS) {
    // Reuse existing element from HMR to avoid duplicates
    const existing = document.querySelector('[data-bounds-svg]') as SVGSVGElement | null
    if (existing) {
      _boundsNS = existing
      _boundsPath = existing.querySelector('path') as SVGPathElement
    } else {
      _boundsNS = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      _boundsNS.setAttribute('data-bounds-svg', '')
      _boundsNS.style.position = 'absolute'
      _boundsNS.style.width = '0'
      _boundsNS.style.height = '0'
      _boundsNS.style.overflow = 'hidden'
      document.body.appendChild(_boundsNS)
      _boundsPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      _boundsNS.appendChild(_boundsPath)
    }
  }
  return _boundsPath!
}

function getLayerBounds(layer: DrawingLayer): { x: number; y: number; width: number; height: number } | null {
  if (layer.paths.length === 0) return null

  const pathEl = getSVGBoundsEls()
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const path of layer.paths) {
    pathEl.setAttribute('d', path.d)
    try {
      const bbox = pathEl.getBBox()
      minX = Math.min(minX, bbox.x)
      minY = Math.min(minY, bbox.y)
      maxX = Math.max(maxX, bbox.x + bbox.width)
      maxY = Math.max(maxY, bbox.y + bbox.height)
    } catch {
      // Fallback to coordinate extraction if getBBox fails
      const coords = extractPathCoords(path.d)
      for (const { x, y } of coords) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (minX === Infinity) return null

  // Apply layer scale transforms to bounds
  const sx = (layer.scaleX ?? layer.scale ?? 1)
  const sy = (layer.scaleY ?? layer.scale ?? 1)
  if (sx !== 1 || sy !== 1) {
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const hw = (maxX - minX) / 2
    const hh = (maxY - minY) / 2
    minX = cx - hw * Math.abs(sx)
    maxX = cx + hw * Math.abs(sx)
    minY = cy - hh * Math.abs(sy)
    maxY = cy + hh * Math.abs(sy)
  }

  const pad = 20
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  }
}

export function DrawingOverlay({ slideId, interactive = false }: Props) {
  const slide = usePortfolioStore((s) => s.slides.find((sl) => sl.id === slideId))
  const selectedLayerIds = usePortfolioStore((s) => s.selectedDrawingLayerIds)
  const selectedLayerId = selectedLayerIds[0] ?? null
  const addPathToLayer = usePortfolioStore((s) => s.addPathToLayer)
  const removePathFromLayer = usePortfolioStore((s) => s.removePathFromLayer)
  const updateDrawingLayerTransform = usePortfolioStore((s) => s.updateDrawingLayerTransform)
  const activeTool = usePortfolioStore((s) => s.drawTool)
  const strokeWidth = usePortfolioStore((s) => s.drawStrokeWidth)
  const strokeColor = usePortfolioStore((s) => s.drawStrokeColor)
  const shapeType = usePortfolioStore((s) => s.drawShapeType)
  const shapeFilled = usePortfolioStore((s) => s.drawShapeFilled)

  const svgRef = useRef<SVGSVGElement>(null)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const pointsRef = useRef<{ x: number; y: number }[]>([])

  // Shape tool drag state
  const [shapeDrag, setShapeDrag] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)

  // Hand tool drag state
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number }>({ x: 0, y: 0, ox: 0, oy: 0 })

  // Rotate/scale handle drag state
  const [handleDrag, setHandleDrag] = useState<'rotate' | 'scale' | null>(null)
  const handleStartRef = useRef<{ x: number; y: number; startRotation: number; startScale: number; startScaleX: number; startScaleY: number; cx: number; cy: number; bw: number; bh: number }>({ x: 0, y: 0, startRotation: 0, startScale: 1, startScaleX: 1, startScaleY: 1, cx: 0, cy: 0, bw: 0, bh: 0 })

  const layers = slide?.drawingLayers ?? []
  const selectedLayer = layers.find((l) => l.id === selectedLayerId)

  // Compute bounds for all selected layers combined
  const selectedLayers = useMemo(() =>
    layers.filter((l) => selectedLayerIds.includes(l.id)),
    [layers, selectedLayerIds]
  )

  const bounds = useMemo(() => {
    if (selectedLayers.length === 0 || !interactive) return null
    if (selectedLayers.length === 1) return getLayerBounds(selectedLayers[0])

    // Combined bounding box across all selected layers (accounting for offsets)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const layer of selectedLayers) {
      const lb = getLayerBounds(layer)
      if (!lb) continue
      const ox = layer.offsetX ?? 0
      const oy = layer.offsetY ?? 0
      minX = Math.min(minX, lb.x + ox)
      minY = Math.min(minY, lb.y + oy)
      maxX = Math.max(maxX, lb.x + lb.width + ox)
      maxY = Math.max(maxY, lb.y + lb.height + oy)
    }
    if (minX === Infinity) return null
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }, [selectedLayers, interactive])

  const getSvgPoint = useCallback((e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = 1920 / rect.width
    const scaleY = 1080 / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  const selectDrawingLayer = usePortfolioStore((s) => s.selectDrawingLayer)
  const toggleDrawingLayerSelection = usePortfolioStore((s) => s.toggleDrawingLayerSelection)
  const duplicateDrawingLayer = usePortfolioStore((s) => s.duplicateDrawingLayer)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!interactive) return

    // Cmd+click = select layer, Shift+Cmd+click = add to selection
    if (e.metaKey || e.ctrlKey) {
      const addToSelection = e.shiftKey
      e.preventDefault()
      const pt = getSvgPoint(e)
      // Hit-test layers top-to-bottom (reversed so topmost layer wins)
      for (let li = layers.length - 1; li >= 0; li--) {
        const layer = layers[li]
        if (!layer.visible) continue

        // Transform the click point into layer-local space
        // Undo: translate, then rotate+scale around content center
        let lx = pt.x - (layer.offsetX ?? 0)
        let ly = pt.y - (layer.offsetY ?? 0)
        const r = layer.rotation ?? 0
        const s = layer.scale ?? 1
        if (r !== 0 || s !== 1) {
          const lb = getLayerBounds(layer)
          if (lb) {
            const cx = lb.x + lb.width / 2
            const cy = lb.y + lb.height / 2
            // Translate to center, undo scale, undo rotation, translate back
            let dx = lx - cx
            let dy = ly - cy
            dx /= s
            dy /= s
            const rad = -r * Math.PI / 180
            const cos = Math.cos(rad)
            const sin = Math.sin(rad)
            lx = cx + dx * cos - dy * sin
            ly = cy + dx * sin + dy * cos
          }
        }

        for (let pi = layer.paths.length - 1; pi >= 0; pi--) {
          const pathEl = svgRef.current?.querySelector(`[data-layer="${layer.id}"][data-path="${pi}"]`) as SVGPathElement | null
          if (pathEl) {
            const point = svgRef.current!.createSVGPoint()
            point.x = lx
            point.y = ly
            try {
              const origWidth = pathEl.style.strokeWidth
              pathEl.style.strokeWidth = '24'
              const hit = pathEl.isPointInStroke(point) || (pathEl.getAttribute('fill') !== 'none' && pathEl.isPointInFill(point))
              pathEl.style.strokeWidth = origWidth
              if (hit) {
                if (addToSelection) {
                  toggleDrawingLayerSelection(layer.id)
                } else {
                  selectDrawingLayer(layer.id)
                }
                return
              }
            } catch { /* ignore */ }
          }
        }
      }
      // Clicked on nothing — deselect (unless adding to selection)
      if (!addToSelection) selectDrawingLayer(null)
      return
    }

    if (!selectedLayerId) return

    // Option/Alt + click on any tool = duplicate layer in place
    if (e.altKey && selectedLayerId) {
      duplicateDrawingLayer(slideId, selectedLayerId, true)
      // If not hand tool, continue with the current tool action on the new layer
      if (activeTool !== 'hand') {
        // Let the rest of the handler proceed with the duplicated (now selected) layer
      } else {
        // Hand tool: set up drag
        e.preventDefault()
        ;(e.target as Element).setPointerCapture(e.pointerId)
        const pt = getSvgPoint(e)
        dragStartRef.current = { x: pt.x, y: pt.y, ox: 0, oy: 0 }
        setIsDragging(true)
        return
      }
    }

    if (activeTool === 'hand') {
      e.preventDefault()
      ;(e.target as Element).setPointerCapture(e.pointerId)

      // Push undo before starting the move
      usePortfolioStore.getState()._pushHistory()

      const pt = getSvgPoint(e)
      dragStartRef.current = {
        x: pt.x,
        y: pt.y,
        ox: 0,
        oy: 0,
      }
      setIsDragging(true)
      return
    }

    if (activeTool === 'eraser') {
      const pt = getSvgPoint(e)
      const layer = layers.find((l) => l.id === selectedLayerId)
      if (layer) {
        for (let i = layer.paths.length - 1; i >= 0; i--) {
          const pathEl = svgRef.current?.querySelector(`[data-layer="${selectedLayerId}"][data-path="${i}"]`) as SVGPathElement | null
          if (pathEl) {
            const point = svgRef.current!.createSVGPoint()
            point.x = pt.x - (layer.offsetX ?? 0)
            point.y = pt.y - (layer.offsetY ?? 0)
            try {
              if (pathEl.isPointInStroke(point)) {
                removePathFromLayer(slideId, selectedLayerId, i)
                return
              }
            } catch { /* ignore */ }
          }
        }
      }
      return
    }

    // Shape tool — click-drag to define bounds
    if (activeTool === 'shape') {
      e.preventDefault()
      ;(e.target as Element).setPointerCapture(e.pointerId)
      usePortfolioStore.getState()._pushHistory()
      const pt = getSvgPoint(e)
      const layer = layers.find((l) => l.id === selectedLayerId)
      const lx = pt.x - (layer?.offsetX ?? 0)
      const ly = pt.y - (layer?.offsetY ?? 0)
      setShapeDrag({ startX: lx, startY: ly, endX: lx, endY: ly })
      return
    }

    // Pen tool
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    usePortfolioStore.getState()._pushHistory()
    const pt = getSvgPoint(e)
    // Adjust for layer offset so path coords are layer-local
    const layer = layers.find((l) => l.id === selectedLayerId)
    const lx = pt.x - (layer?.offsetX ?? 0)
    const ly = pt.y - (layer?.offsetY ?? 0)
    pointsRef.current = [{ x: lx, y: ly }]
    setCurrentPoints([{ x: lx, y: ly }])
    setIsDrawing(true)
  }, [interactive, selectedLayerId, activeTool, getSvgPoint, layers, removePathFromLayer, slideId])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Shape drag preview
    if (shapeDrag && activeTool === 'shape') {
      const pt = getSvgPoint(e)
      const layer = layers.find((l) => l.id === selectedLayerId)
      let lx = pt.x - (layer?.offsetX ?? 0)
      let ly = pt.y - (layer?.offsetY ?? 0)
      // Default: locked 1:1 aspect. Shift: free aspect.
      if (!e.shiftKey) {
        const dx = lx - shapeDrag.startX
        const dy = ly - shapeDrag.startY
        const size = Math.max(Math.abs(dx), Math.abs(dy))
        lx = shapeDrag.startX + size * Math.sign(dx || 1)
        ly = shapeDrag.startY + size * Math.sign(dy || 1)
      }
      setShapeDrag((prev) => prev ? { ...prev, endX: lx, endY: ly } : null)
      return
    }

    if (isDragging && activeTool === 'hand' && selectedLayerIds.length > 0) {
      const pt = getSvgPoint(e)
      const dx = pt.x - dragStartRef.current.x
      const dy = pt.y - dragStartRef.current.y
      // Batch all layer moves into a single state update
      const idSet = new Set(selectedLayerIds)
      usePortfolioStore.setState((state) => ({
        slides: state.slides.map((s) => {
          if (s.id !== slideId) return s
          return {
            ...s,
            drawingLayers: (s.drawingLayers ?? []).map((l) =>
              idSet.has(l.id) ? { ...l, offsetX: (l.offsetX ?? 0) + dx, offsetY: (l.offsetY ?? 0) + dy } : l
            ),
          }
        }),
      }))
      dragStartRef.current.x = pt.x
      dragStartRef.current.y = pt.y
      return
    }

    if (handleDrag && selectedLayers.length > 0 && bounds) {
      const pt = getSvgPoint(e)
      const cx = handleStartRef.current.cx
      const cy = handleStartRef.current.cy

      if (handleDrag === 'rotate') {
        const angle = Math.atan2(pt.y - cy, pt.x - cx) * (180 / Math.PI)
        const startAngle = Math.atan2(handleStartRef.current.y - cy, handleStartRef.current.x - cx) * (180 / Math.PI)
        const deltaRotation = angle - startAngle

        if (selectedLayers.length === 1) {
          const layer = selectedLayers[0]
          updateDrawingLayerTransform(slideId, layer.id, ((handleStartRef.current.startRotation + deltaRotation) % 360 + 360) % 360, layer.scale)
        } else {
          // Batch multi-layer rotate into single state update
          const updates = new Map<string, { offsetX: number; offsetY: number; rotation: number }>()
          for (const layer of selectedLayers) {
            const layerOx = layer.offsetX ?? 0
            const layerOy = layer.offsetY ?? 0
            const lb = getLayerBounds(layer)
            if (lb) {
              const layerCx = lb.x + lb.width / 2 + layerOx
              const layerCy = lb.y + lb.height / 2 + layerOy
              const rad = deltaRotation * Math.PI / 180
              const cos = Math.cos(rad)
              const sin = Math.sin(rad)
              const ddx = layerCx - cx
              const ddy = layerCy - cy
              updates.set(layer.id, {
                offsetX: layerOx + (cx + ddx * cos - ddy * sin - layerCx),
                offsetY: layerOy + (cy + ddx * sin + ddy * cos - layerCy),
                rotation: (((layer.rotation ?? 0) + deltaRotation) % 360 + 360) % 360,
              })
            }
          }
          usePortfolioStore.setState((state) => ({
            slides: state.slides.map((s) => {
              if (s.id !== slideId) return s
              return {
                ...s,
                drawingLayers: (s.drawingLayers ?? []).map((l) => {
                  const u = updates.get(l.id)
                  return u ? { ...l, offsetX: u.offsetX, offsetY: u.offsetY, rotation: u.rotation } : l
                }),
              }
            }),
          }))
        }
        // Update start angle for delta tracking
        handleStartRef.current.x = pt.x
        handleStartRef.current.y = pt.y
        handleStartRef.current.startRotation = selectedLayers[0]?.rotation ?? 0
      } else if (handleDrag === 'scale') {
        const startDist = Math.hypot(handleStartRef.current.x - cx, handleStartRef.current.y - cy)
        const currentDist = Math.hypot(pt.x - cx, pt.y - cy)
        const ratio = currentDist / Math.max(startDist, 1)

        if (selectedLayers.length === 1) {
          const layer = selectedLayers[0]
          if (e.shiftKey) {
            const dx = pt.x - handleStartRef.current.x
            const dy = pt.y - handleStartRef.current.y
            const startBw = handleStartRef.current.bw || 100
            const startBh = handleStartRef.current.bh || 100
            const newScaleX = Math.max(0.1, Math.min(5, handleStartRef.current.startScaleX + dx / startBw))
            const newScaleY = Math.max(0.1, Math.min(5, handleStartRef.current.startScaleY + dy / startBh))
            updateDrawingLayerTransform(slideId, layer.id, layer.rotation, layer.scale, newScaleX, newScaleY)
          } else {
            const newScale = Math.max(0.1, Math.min(5, handleStartRef.current.startScale * ratio))
            updateDrawingLayerTransform(slideId, layer.id, layer.rotation, newScale, 1, 1)
          }
        } else {
          // Multi: batch all layer scale updates into single state update
          const updates = new Map<string, { offsetX: number; offsetY: number; scale?: number; scaleX?: number; scaleY?: number }>()
          if (e.shiftKey) {
            // Unlocked aspect ratio for groups
            const dx = pt.x - handleStartRef.current.x
            const dy = pt.y - handleStartRef.current.y
            const startBw = handleStartRef.current.bw || 100
            const startBh = handleStartRef.current.bh || 100
            const ratioX = 1 + dx / startBw
            const ratioY = 1 + dy / startBh
            for (const layer of selectedLayers) {
              const sx = Math.max(0.1, Math.min(5, (layer.scaleX ?? layer.scale ?? 1) * ratioX))
              const sy = Math.max(0.1, Math.min(5, (layer.scaleY ?? layer.scale ?? 1) * ratioY))
              const layerOx = layer.offsetX ?? 0
              const layerOy = layer.offsetY ?? 0
              const lb = getLayerBounds(layer)
              if (lb) {
                const layerCx = lb.x + lb.width / 2 + layerOx
                const layerCy = lb.y + lb.height / 2 + layerOy
                updates.set(layer.id, {
                  offsetX: layerOx + (layerCx - cx) * (ratioX - 1),
                  offsetY: layerOy + (layerCy - cy) * (ratioY - 1),
                  scaleX: sx, scaleY: sy,
                })
              }
            }
          } else {
            for (const layer of selectedLayers) {
              const newScale = Math.max(0.1, Math.min(5, (layer.scale ?? 1) * ratio))
              const layerOx = layer.offsetX ?? 0
              const layerOy = layer.offsetY ?? 0
              const lb = getLayerBounds(layer)
              if (lb) {
                const layerCx = lb.x + lb.width / 2 + layerOx
                const layerCy = lb.y + lb.height / 2 + layerOy
                updates.set(layer.id, {
                  offsetX: layerOx + (layerCx - cx) * (ratio - 1),
                  offsetY: layerOy + (layerCy - cy) * (ratio - 1),
                  scale: newScale,
                })
              }
            }
          }
          // Apply all batched updates in one setState
          usePortfolioStore.setState((state) => ({
            slides: state.slides.map((s) => {
              if (s.id !== slideId) return s
              return {
                ...s,
                drawingLayers: (s.drawingLayers ?? []).map((l) => {
                  const u = updates.get(l.id)
                  if (!u) return l
                  return {
                    ...l,
                    offsetX: u.offsetX,
                    offsetY: u.offsetY,
                    ...(u.scale !== undefined ? { scale: u.scale } : {}),
                    ...(u.scaleX !== undefined ? { scaleX: u.scaleX } : {}),
                    ...(u.scaleY !== undefined ? { scaleY: u.scaleY } : {}),
                  }
                }),
              }
            }),
          }))
          // Reset start for delta
          handleStartRef.current.x = pt.x
          handleStartRef.current.y = pt.y
        }
      }
      return
    }

    if (!isDrawing || activeTool !== 'pen') return
    const pt = getSvgPoint(e)
    const layer = layers.find((l) => l.id === selectedLayerId)
    const lx = pt.x - (layer?.offsetX ?? 0)
    const ly = pt.y - (layer?.offsetY ?? 0)
    pointsRef.current.push({ x: lx, y: ly })
    if (pointsRef.current.length % 2 === 0) {
      setCurrentPoints([...pointsRef.current])
    }
  }, [isDragging, isDrawing, activeTool, getSvgPoint, selectedLayerId, slideId, handleDrag, selectedLayer, bounds, updateDrawingLayerTransform, layers, shapeDrag, selectedLayerIds])

  const handlePointerUp = useCallback(() => {
    // Finalize shape
    if (shapeDrag && activeTool === 'shape' && selectedLayerId) {
      const { startX, startY, endX, endY } = shapeDrag
      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)
      const w = Math.abs(endX - startX)
      const h = Math.abs(endY - startY)
      if (w > 5 && h > 5) {
        const d = generateShapePath(shapeType, x, y, w, h)
        const isClosedShape = shapeType !== 'zigzag'
        const path: DrawingPath = {
          d,
          stroke: strokeColor,
          strokeWidth,
          opacity: 1,
          ...(shapeFilled && isClosedShape ? {} : {}),
        }
        // For filled shapes, we use a special convention: negative opacity = filled
        // Actually, let's store fill info differently — add fill to the path d
        // Simpler: just add as a regular path. Fill is handled at render time via a data attribute.
        addPathToLayer(slideId, selectedLayerId, {
          d,
          stroke: strokeColor,
          strokeWidth: shapeFilled && isClosedShape ? 0.5 : strokeWidth,
          opacity: shapeFilled ? -1 : 1, // negative = filled
        })
      }
      setShapeDrag(null)
      return
    }

    if (isDragging) {
      setIsDragging(false)
      return
    }

    if (handleDrag) {
      setHandleDrag(null)
      return
    }

    if (!isDrawing || !selectedLayerId || activeTool !== 'pen') {
      setIsDrawing(false)
      return
    }

    const simplified = simplifyPoints(pointsRef.current)
    if (simplified.length > 0) {
      const path: DrawingPath = {
        d: pointsToPath(simplified),
        stroke: strokeColor,
        strokeWidth,
        opacity: 1,
      }
      addPathToLayer(slideId, selectedLayerId, path)
    }

    pointsRef.current = []
    setCurrentPoints([])
    setIsDrawing(false)
  }, [isDragging, handleDrag, isDrawing, selectedLayerId, activeTool, strokeColor, strokeWidth, addPathToLayer, slideId, shapeDrag, shapeType, shapeFilled])

  const previewPath = isDrawing && currentPoints.length > 1 ? pointsToPath(currentPoints) : null

  // Bounding box for selected layer (adjusted with offset)
  const isMultiSelect = selectedLayers.length > 1
  const showBounds = interactive && selectedLayers.length > 0 && bounds && (activeTool === 'hand' || activeTool === 'pen')
  // For single layer, bounds are layer-local so add offset. For multi, bounds already include offsets.
  const bx = bounds ? (isMultiSelect ? bounds.x : bounds.x + (selectedLayer?.offsetX ?? 0)) : 0
  const by = bounds ? (isMultiSelect ? bounds.y : bounds.y + (selectedLayer?.offsetY ?? 0)) : 0
  const bw = bounds?.width ?? 0
  const bh = bounds?.height ?? 0

  const startHandleDrag = useCallback((type: 'rotate' | 'scale', e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    usePortfolioStore.getState()._pushHistory()
    const pt = getSvgPoint(e)
    handleStartRef.current = {
      x: pt.x,
      y: pt.y,
      startRotation: selectedLayer?.rotation ?? 0,
      startScale: selectedLayer?.scale ?? 1,
      startScaleX: selectedLayer?.scaleX ?? 1,
      startScaleY: selectedLayer?.scaleY ?? 1,
      cx: bx + bw / 2,
      cy: by + bh / 2,
      bw,
      bh,
    }
    setHandleDrag(type)
  }, [getSvgPoint, selectedLayer, bx, by, bw, bh])

  const cursor = !interactive ? 'default'
    : !selectedLayerId ? 'default'
    : activeTool === 'hand' ? (isDragging ? 'grabbing' : 'grab')
    : activeTool === 'eraser' ? 'crosshair'
    : 'crosshair'

  return (
    <svg
      ref={svgRef}
      width="1920"
      height="1080"
      viewBox="0 0 1920 1080"
      className="absolute inset-0"
      style={{
        zIndex: 20,
        pointerEvents: interactive ? 'all' : 'none',
        cursor,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {layers.map((layer) => {
        if (!layer.visible) return null
        const ox = layer.offsetX ?? 0
        const oy = layer.offsetY ?? 0
        const r = layer.rotation ?? 0
        const s = layer.scale ?? 1
        const sx = layer.scaleX ?? 1
        const sy = layer.scaleY ?? 1

        // Build transform: translate → rotate → scale (all around content center)
        let transform = `translate(${ox}, ${oy})`
        if (r !== 0 || s !== 1 || sx !== 1 || sy !== 1) {
          const lb = getLayerBounds(layer)
          if (lb) {
            const cx = lb.x + lb.width / 2
            const cy = lb.y + lb.height / 2
            transform += ` translate(${cx}, ${cy}) rotate(${r}) scale(${s * sx}, ${s * sy}) translate(${-cx}, ${-cy})`
          }
        }

        return (
          <g key={layer.id} transform={transform} opacity={layer.opacity ?? 1}>
            {layer.paths.map((path, i) => {
              const isFilled = path.opacity < 0
              const color = COLOR_MAP[path.stroke] ?? path.stroke
              return (
                <path
                  key={i}
                  d={path.d}
                  stroke={color}
                  strokeWidth={path.strokeWidth}
                  fill={isFilled ? color : 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={Math.abs(path.opacity)}
                  vectorEffect="non-scaling-stroke"
                  data-layer={layer.id}
                  data-path={i}
                />
              )
            })}
          </g>
        )
      })}

      {/* Preview path while drawing */}
      {previewPath && selectedLayer && (
        <g transform={`translate(${selectedLayer.offsetX ?? 0}, ${selectedLayer.offsetY ?? 0})`}>
          <path
            d={previewPath}
            stroke={COLOR_MAP[strokeColor] ?? strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
        </g>
      )}

      {/* Shape preview while dragging */}
      {shapeDrag && selectedLayer && (() => {
        const { startX, startY, endX, endY } = shapeDrag
        const x = Math.min(startX, endX)
        const y = Math.min(startY, endY)
        const w = Math.abs(endX - startX)
        const h = Math.abs(endY - startY)
        if (w < 2 && h < 2) return null
        const d = generateShapePath(shapeType, x, y, w, h)
        const color = COLOR_MAP[strokeColor] ?? strokeColor
        const isClosedShape = shapeType !== 'zigzag'
        return (
          <g transform={`translate(${selectedLayer.offsetX ?? 0}, ${selectedLayer.offsetY ?? 0})`}>
            <path
              d={d}
              stroke={color}
              strokeWidth={shapeFilled && isClosedShape ? 0.5 : strokeWidth}
              fill={shapeFilled && isClosedShape ? color : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.6}
            />
          </g>
        )
      })()}

      {/* Bounding box + handles for selected layer(s) */}
      {showBounds && bounds && (() => {
        let bbTransform = ''
        let totalSx = 1
        let totalSy = 1

        if (!isMultiSelect && selectedLayer) {
          // Single layer: rotate with the layer
          const r = selectedLayer.rotation ?? 0
          const s = selectedLayer.scale ?? 1
          const sx = selectedLayer.scaleX ?? 1
          const sy = selectedLayer.scaleY ?? 1
          totalSx = s * sx
          totalSy = s * sy
          const ox = selectedLayer.offsetX ?? 0
          const oy = selectedLayer.offsetY ?? 0
          const cx = bounds.x + bounds.width / 2
          const cy = bounds.y + bounds.height / 2
          bbTransform = `translate(${ox}, ${oy})`
          if (r !== 0 || totalSx !== 1 || totalSy !== 1) {
            bbTransform += ` translate(${cx}, ${cy}) rotate(${r}) scale(${totalSx}, ${totalSy}) translate(${-cx}, ${-cy})`
          }
        }
        // Multi-select: bounds are in world space, no transform needed
        // Bounding box coords in layer-local space (no offset)
        const lx = bounds.x
        const ly = bounds.y
        const lw = bounds.width
        const lh = bounds.height

        return (
          <g transform={bbTransform}>
            {/* Dashed bounding rectangle */}
            <rect
              x={lx} y={ly} width={lw} height={lh}
              fill="none" stroke="#3b82f6" strokeWidth={1.5 / Math.max(totalSx, totalSy)}
              strokeDasharray={`${6 / Math.max(totalSx, totalSy)} ${4 / Math.max(totalSx, totalSy)}`} rx={4 / Math.max(totalSx, totalSy)}
            />

            {/* Rotate handle — top center */}
            <line
              x1={lx + lw / 2} y1={ly}
              x2={lx + lw / 2} y2={ly - 30 / totalSy}
              stroke="#3b82f6" strokeWidth={1.5 / Math.max(totalSx, totalSy)}
            />
            <circle
              cx={lx + lw / 2} cy={ly - 36 / totalSy}
              r={8 / Math.max(totalSx, totalSy)} fill="white" stroke="#3b82f6" strokeWidth={1.5 / Math.max(totalSx, totalSy)}
              style={{ cursor: 'grab', pointerEvents: 'all' }}
              onPointerDown={(e) => startHandleDrag('rotate', e)}
            />

            {/* Scale handle — bottom right corner */}
            <circle
              cx={lx + lw} cy={ly + lh}
              r={7 / Math.max(totalSx, totalSy)} fill="white" stroke="#3b82f6" strokeWidth={1.5 / Math.max(totalSx, totalSy)}
              style={{ cursor: 'nwse-resize', pointerEvents: 'all' }}
              onPointerDown={(e) => startHandleDrag('scale', e)}
            />
          </g>
        )
      })()}
    </svg>
  )
}
