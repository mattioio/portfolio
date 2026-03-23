import { useRef, useState, useEffect, useCallback } from 'react'
import { usePortfolioStore } from '../../store/portfolio-store'
import { SlideFrame } from '../slides/SlideFrame'
import { SlideRenderer } from '../slides/SlideRenderer'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Maximize,
  Minimize,
} from 'lucide-react'
import { DrawingOverlay } from '../draw/DrawingOverlay'
import { nanoid } from 'nanoid'
import type { DrawingLayer } from '../../store/types'

// Module-level clipboard for draw layer copy/paste
let _drawClipboard: { layers: DrawingLayer[]; groupId?: string } | null = null

export function Canvas() {
  const slides = usePortfolioStore((s) => s.slides)
  const selectedSlideId = usePortfolioStore((s) => s.selectedSlideId)
  const selectSlide = usePortfolioStore((s) => s.selectSlide)
  const isFullscreen = usePortfolioStore((s) => s.isFullscreen)
  const toggleFullscreen = usePortfolioStore((s) => s.toggleFullscreen)
  const appMode = usePortfolioStore((s) => s.appMode)
  const textureImage = usePortfolioStore((s) => s.textureImage)
  const textureBlendMode = usePortfolioStore((s) => s.textureBlendMode)
  const textureOpacity = usePortfolioStore((s) => s.textureOpacity)
  const containerRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(0.5)
  const [zoomOverride, setZoomOverride] = useState<number | null>(null) // null = fit
  const ZOOM_STEPS = [0.1, 0.17, 0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.5, 2.0]
  const scale = zoomOverride ?? fitScale

  const zoomIn = () => {
    const current = zoomOverride ?? fitScale
    const next = ZOOM_STEPS.find((s) => s > current + 0.001)
    if (next) setZoomOverride(next)
  }
  const zoomOut = () => {
    const current = zoomOverride ?? fitScale
    const prev = [...ZOOM_STEPS].reverse().find((s) => s < current - 0.001)
    if (prev) setZoomOverride(prev)
  }
  const zoomFit = () => setZoomOverride(null)

  const selectedSlide = slides.find((s) => s.id === selectedSlideId) ?? slides[0]
  const currentIndex = slides.findIndex((s) => s.id === selectedSlide?.id)
  const updateFitScale = useCallback(() => {
    if (!containerRef.current) return
    const { clientWidth, clientHeight } = containerRef.current
    const padding = 64
    const scaleX = (clientWidth - padding) / 1920
    const scaleY = (clientHeight - padding) / 1080
    setFitScale(Math.min(scaleX, scaleY, 1))
  }, [])

  useEffect(() => {
    updateFitScale()
    const observer = new ResizeObserver(updateFitScale)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [updateFitScale])

  // Escape exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleFullscreen()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFullscreen, toggleFullscreen])

  const goToPrev = () => {
    if (currentIndex > 0) selectSlide(slides[currentIndex - 1].id)
  }
  const goToNext = () => {
    if (currentIndex < slides.length - 1)
      selectSlide(slides[currentIndex + 1].id)
  }

  const toggleSlideDarkMode = usePortfolioStore((s) => s.toggleSlideDarkMode)
  const setSlideStyleVariant = usePortfolioStore((s) => s.setSlideStyleVariant)
  const duplicateSlide = usePortfolioStore((s) => s.duplicateSlide)
  const removeSlide = usePortfolioStore((s) => s.removeSlide)
  const setAppMode = usePortfolioStore((s) => s.setAppMode)

  // --- Declarative keyboard shortcut map ---
  // Complex handlers extracted as named functions
  const handleCopy = useCallback(() => {
    if (appMode !== 'draw' || !selectedSlide) return
    const store = usePortfolioStore.getState()
    const ids = store.selectedDrawingLayerIds
    if (ids.length === 0) return
    const allLayers = selectedSlide.drawingLayers ?? []
    const copied = allLayers.filter((l) => ids.includes(l.id))
    const groupId = copied.length > 1 && copied.every((l) => l.groupId && l.groupId === copied[0].groupId) ? copied[0].groupId : undefined
    _drawClipboard = { layers: JSON.parse(JSON.stringify(copied)), groupId }
  }, [appMode, selectedSlide])

  const handlePaste = useCallback(() => {
    if (appMode !== 'draw' || !selectedSlide || !_drawClipboard) return
    usePortfolioStore.getState()._pushHistory()
    const offset = 30
    const newGroupId = _drawClipboard.groupId ? nanoid() : undefined
    const newLayers = _drawClipboard.layers.map((layer) => ({
      ...JSON.parse(JSON.stringify(layer)),
      id: nanoid(),
      name: layer.name + ' copy',
      offsetX: (layer.offsetX ?? 0) + offset,
      offsetY: (layer.offsetY ?? 0) + offset,
      groupId: newGroupId ?? undefined,
    })) as DrawingLayer[]
    const origGroup = _drawClipboard.groupId
      ? selectedSlide.drawingGroups?.find((g) => g.id === _drawClipboard!.groupId)
      : null
    const newGroup = newGroupId && origGroup
      ? [{ id: newGroupId, name: origGroup.name + ' copy', visible: true }]
      : []
    usePortfolioStore.setState((state) => ({
      slides: state.slides.map((s) => {
        if (s.id !== selectedSlide.id) return s
        return {
          ...s,
          drawingLayers: [...(s.drawingLayers ?? []), ...newLayers],
          drawingGroups: [...(s.drawingGroups ?? []), ...newGroup],
        }
      }),
      selectedDrawingLayerIds: newLayers.map((l) => l.id),
    }))
  }, [appMode, selectedSlide])

  const handleDuplicate = useCallback(() => {
    if (!selectedSlide) return
    if (appMode === 'draw') {
      const store = usePortfolioStore.getState()
      const layerId = store.selectedDrawingLayerIds[0]
      if (layerId) store.duplicateDrawingLayer(selectedSlide.id, layerId)
    } else {
      duplicateSlide(selectedSlide.id)
    }
  }, [appMode, selectedSlide, duplicateSlide])

  const handleDelete = useCallback(() => {
    if (!selectedSlide) return
    if (appMode === 'draw') {
      const store = usePortfolioStore.getState()
      if (store.selectedDrawingLayerIds.length > 0) store.removeSelectedDrawingLayers(selectedSlide.id)
    } else if (slides.length > 1) {
      removeSlide(selectedSlide.id)
    }
  }, [appMode, selectedSlide, slides.length, removeSlide])

  const handleGroup = useCallback((e: KeyboardEvent) => {
    if (!selectedSlide || appMode !== 'draw') return
    const store = usePortfolioStore.getState()
    e.shiftKey ? store.ungroupDrawingLayers(selectedSlide.id) : store.groupDrawingLayers(selectedSlide.id)
  }, [appMode, selectedSlide])

  const handleTab = useCallback((e: KeyboardEvent) => {
    if (appMode !== 'draw' || !selectedSlide) return
    const store = usePortfolioStore.getState()
    if (store.drawShapePickerOpen) { store.setDrawShapeFilled(!store.drawShapeFilled); return }
    const layers = selectedSlide.drawingLayers ?? []
    if (layers.length === 0) return
    const currentId = store.selectedDrawingLayerIds[0]
    const currentIdx = currentId ? layers.findIndex((l) => l.id === currentId) : -1
    const nextIdx = e.shiftKey
      ? (currentIdx < layers.length - 1 ? currentIdx + 1 : 0)
      : (currentIdx > 0 ? currentIdx - 1 : layers.length - 1)
    store.selectDrawingLayer(layers[nextIdx].id)
  }, [appMode, selectedSlide])

  const handleEscape = useCallback(() => {
    if (appMode !== 'draw') return
    const store = usePortfolioStore.getState()
    if (store.drawShapePickerOpen) { store.setDrawShapePickerOpen(false); return }
    const ids = store.selectedDrawingLayerIds
    if (ids.length === 1 && selectedSlide) {
      const layers = selectedSlide.drawingLayers ?? []
      const layer = layers.find((l) => l.id === ids[0])
      if (layer?.groupId) {
        const groupSiblings = layers.filter((l) => l.groupId === layer.groupId).map((l) => l.id)
        usePortfolioStore.setState({ selectedDrawingLayerIds: groupSiblings })
        return
      }
    }
    store.selectDrawingLayer(null)
  }, [appMode, selectedSlide])

  const handleNudge = useCallback((e: KeyboardEvent) => {
    if (appMode !== 'draw' || !selectedSlide) return false
    const store = usePortfolioStore.getState()
    const ids = store.selectedDrawingLayerIds
    if (ids.length === 0) return false
    const step = (e.metaKey || e.ctrlKey) ? 1 : 10
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
    const layers = selectedSlide.drawingLayers ?? []
    // Expand selection to include all group members
    const allIds = new Set(ids)
    for (const id of ids) {
      const layer = layers.find((l) => l.id === id)
      if (layer?.groupId) layers.filter((l) => l.groupId === layer.groupId).forEach((l) => allIds.add(l.id))
    }
    // Batch all layer moves into a single state update
    const slideId = selectedSlide.id
    usePortfolioStore.setState((state) => ({
      slides: state.slides.map((s) => {
        if (s.id !== slideId) return s
        return {
          ...s,
          drawingLayers: (s.drawingLayers ?? []).map((l) =>
            allIds.has(l.id) ? { ...l, offsetX: (l.offsetX ?? 0) + dx, offsetY: (l.offsetY ?? 0) + dy } : l
          ),
        }
      }),
    }))
    return true
  }, [appMode, selectedSlide])

  const handleShapeToggle = useCallback(() => {
    const store = usePortfolioStore.getState()
    if (store.drawTool === 'shape') {
      store.setDrawShapePickerOpen(!store.drawShapePickerOpen)
    } else {
      store.setDrawTool('shape')
      store.setDrawShapePickerOpen(false)
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target?.contentEditable === 'true' || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      const cmd = e.metaKey || e.ctrlKey
      const key = e.key

      // --- Cmd/Ctrl shortcuts (always active) ---
      if (cmd) {
        const cmdMap: Record<string, () => void> = {
          z: () => e.shiftKey ? usePortfolioStore.getState().redo() : usePortfolioStore.getState().undo(),
          c: handleCopy,
          v: handlePaste,
          d: handleDuplicate,
          g: () => handleGroup(e),
        }
        if (key === 'Backspace' || key === 'Delete') { e.preventDefault(); handleDelete(); return }
        if (cmdMap[key]) { e.preventDefault(); cmdMap[key](); return }
      }

      // --- Special keys ---
      if (key === 'Tab') { e.preventDefault(); handleTab(e); return }
      if (key === 'Escape') { e.preventDefault(); handleEscape(); return }
      // Prevent Space from scrolling the page (breaks drag interactions)
      if (key === ' ') { e.preventDefault(); return }

      // --- Shift+Arrow: nudge (draw mode) ---
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        if (handleNudge(e)) { e.preventDefault(); return }
      }

      // --- Arrow keys: slide navigation ---
      if (key === 'ArrowUp' || key === 'ArrowLeft') { e.preventDefault(); goToPrev(); return }
      if (key === 'ArrowDown' || key === 'ArrowRight') { e.preventDefault(); goToNext(); return }

      // --- Plain key shortcuts (no cmd/ctrl) ---
      if (cmd) return

      // Global shortcuts (both modes)
      const globalMap: Record<string, () => void> = {
        '1': () => setAppMode('design'),
        '2': () => setAppMode('draw'),
        '0': zoomFit,
        '-': zoomOut,
        '=': zoomIn,
        '9': toggleFullscreen,
      }
      if (globalMap[key]) { e.preventDefault(); globalMap[key](); return }

      // Draw mode shortcuts
      if (appMode === 'draw') {
        const drawMap: Record<string, () => void> = {
          q: () => usePortfolioStore.getState().setDrawTool('pen'),
          w: () => usePortfolioStore.getState().setDrawTool('eraser'),
          e: () => usePortfolioStore.getState().setDrawTool('hand'),
          r: handleShapeToggle,
          n: () => selectedSlide && usePortfolioStore.getState().addDrawingLayer(selectedSlide.id),
          a: () => usePortfolioStore.getState().setDrawStrokeWidth(3),
          s: () => usePortfolioStore.getState().setDrawStrokeWidth(6),
          d: () => usePortfolioStore.getState().setDrawStrokeWidth(12),
          z: () => usePortfolioStore.getState().setDrawStrokeColor('text'),
          x: () => usePortfolioStore.getState().setDrawStrokeColor('background'),
          c: () => usePortfolioStore.getState().setDrawStrokeColor('accent'),
        }
        if (drawMap[key]) { e.preventDefault(); drawMap[key](); return }
      }

      // Design mode shortcuts
      if (appMode === 'design') {
        if (key === 'n') { e.preventDefault(); usePortfolioStore.getState().setAddSlideSheetOpen(true); return }
        if (!selectedSlide) return
        const variantMap: Record<string, number> = { a: 0, s: 1, d: 2, f: 3 }
        if (variantMap[key] !== undefined) {
          e.preventDefault(); setSlideStyleVariant(selectedSlide.id, variantMap[key]); return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [appMode, selectedSlide, slides.length, goToPrev, goToNext, duplicateSlide, removeSlide, toggleSlideDarkMode, setSlideStyleVariant, setAppMode, zoomIn, zoomOut, zoomFit, toggleFullscreen, handleCopy, handlePaste, handleDuplicate, handleDelete, handleGroup, handleTab, handleEscape, handleNudge, handleShapeToggle])

  if (!selectedSlide) {
    return (
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center text-zinc-600"
      >
        <div className="text-center">
          <p className="text-lg">No slide selected</p>
          <p className="mt-1 text-sm text-zinc-700">
            Add a slide from the sidebar to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-auto bg-zinc-900"
    >
      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute left-3 z-10 rounded-full bg-zinc-800/80 p-1.5 text-zinc-400 backdrop-blur-sm transition-colors hover:text-white"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {currentIndex < slides.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-3 z-10 rounded-full bg-zinc-800/80 p-1.5 text-zinc-400 backdrop-blur-sm transition-colors hover:text-white"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Zoom controls + fullscreen — top right */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* Zoom pill */}
        <div className="flex items-center gap-0.5 rounded-full bg-zinc-800/80 px-1 py-0.5 backdrop-blur-sm">
          <span className="px-2 text-[11px] tabular-nums text-zinc-400">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomOut}
            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:text-white"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={zoomFit}
            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:text-white"
            title="Fit to screen"
            aria-label="Fit to screen"
          >
            <Fullscreen size={14} />
          </button>
          <button
            onClick={zoomIn}
            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:text-white"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Fullscreen pill */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center rounded-full bg-zinc-800/80 p-2 text-zinc-400 backdrop-blur-sm transition-colors hover:text-white"
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
      </div>

      {/* Slide */}
      <div
        className="shadow-2xl"
        style={{ borderRadius: `calc(var(--slide-border-radius) * ${scale})` }}
      >
        <SlideFrame scale={scale} className="rounded-[var(--slide-border-radius)]">
          <div className="relative">
            <div style={{ pointerEvents: appMode === 'draw' ? 'none' : 'auto' }}>
              <SlideRenderer slide={selectedSlide} editable={!isFullscreen && appMode === 'design'} />
            </div>
            {/* Drawing overlay — always visible, only interactive in draw mode */}
            {(selectedSlide.drawingLayers?.length > 0 || appMode === 'draw') && (
              <DrawingOverlay slideId={selectedSlide.id} interactive={appMode === 'draw'} />
            )}
            {/* Texture overlay — flip cycles per slide so consecutive slides look different */}
            {textureImage && (
              <img
                src={textureImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  zIndex: 30,
                  pointerEvents: 'none',
                  mixBlendMode: textureBlendMode as any,
                  opacity: textureOpacity,
                  transform: [
                    '',              // 0: normal
                    'scaleX(-1)',    // 1: flip horizontal
                    'scaleY(-1)',    // 2: flip vertical
                    'scale(-1,-1)',  // 3: flip both
                  ][currentIndex % 4],
                }}
              />
            )}
          </div>
        </SlideFrame>
      </div>

      {/* Bottom bar: slide counter left, variant buttons right */}
      <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center px-4">
        <span className="text-xs text-zinc-500">
          {currentIndex + 1} / {slides.length}
        </span>
      </div>
    </div>
  )
}
