import { useRef, useState, useCallback, useEffect, type ReactNode, type CSSProperties } from 'react'
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { usePortfolioStore } from '../../store/portfolio-store'

interface ImageDropZoneProps {
  image: string
  onImageDrop: (dataUrl: string) => void
  onImageRemove?: () => void
  className?: string
  style?: CSSProperties
  placeholder?: ReactNode
  editable?: boolean
  imgClassName?: string
  children?: ReactNode
  /** Unique key for persisting pan/zoom, e.g. "slideId:image" */
  transformKey?: string
  /** Hide overlay controls (zoom/replace/remove) — useful for background images managed elsewhere */
  hideControls?: boolean
}

export function ImageDropZone({
  image,
  onImageDrop,
  onImageRemove,
  className = '',
  style,
  placeholder,
  editable = true,
  imgClassName = 'h-full w-full object-cover',
  children,
  transformKey,
  hideControls = false,
}: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  // Natural image dimensions to compute crop overflow
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const dragCounter = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const panStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 })

  // Get persisted transform from store
  const transform = usePortfolioStore((s) =>
    transformKey ? s.imageTransforms[transformKey] : undefined
  )
  const setImageTransform = usePortfolioStore((s) => s.setImageTransform)

  // posX/posY are stored as percentage of the overflow range: 0 = centered, -50 = start, 50 = end
  const posX = transform?.x ?? 0
  const posY = transform?.y ?? 0
  const zoom = transform?.zoom ?? 1

  const updateTransform = useCallback(
    (x: number, y: number, z: number) => {
      if (transformKey) {
        setImageTransform(transformKey, { x, y, zoom: z })
      }
    },
    [transformKey, setImageTransform]
  )

  // Load natural image size when image changes
  useEffect(() => {
    if (!image) {
      setNaturalSize(null)
      return
    }
    const img = new Image()
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = image
  }, [image])

  // Compute how much the image overflows the container in each axis
  // Returns { overflowX, overflowY } as ratios (e.g. 0.3 means 30% of the image is hidden)
  const getOverflow = useCallback(() => {
    const container = containerRef.current
    if (!container || !naturalSize) return { overflowX: 0, overflowY: 0 }

    const cw = container.clientWidth
    const ch = container.clientHeight
    if (cw === 0 || ch === 0) return { overflowX: 0, overflowY: 0 }

    const containerAR = cw / ch
    const imageAR = naturalSize.w / naturalSize.h

    // object-cover scales the image so it fills the container, then crops overflow
    // After zoom, the effective scale increases
    let overflowX = 0
    let overflowY = 0

    if (imageAR > containerAR) {
      // Image is wider than container — horizontal overflow (cropped left/right)
      // The displayed width (scaled to fill height) = ch * imageAR
      // Overflow ratio = 1 - (cw / displayedWidth)
      const displayedW = ch * imageAR * zoom
      overflowX = Math.max(0, 1 - cw / displayedW)
    } else {
      // Image is taller than container — vertical overflow (cropped top/bottom)
      const displayedH = (cw / imageAR) * zoom
      overflowY = Math.max(0, 1 - ch / displayedH)
    }

    // Additional zoom overflow in the non-cropped axis
    if (zoom > 1) {
      if (imageAR > containerAR) {
        // Vertically it was fitting, but zoom may create overflow
        const displayedH = ch * zoom
        overflowY = Math.max(0, 1 - ch / displayedH)
      } else {
        const displayedW = cw * zoom
        overflowX = Math.max(0, 1 - cw / displayedW)
      }
    }

    return { overflowX, overflowY }
  }, [naturalSize, zoom])

  // Convert pos (-50..50) to object-position percentage (0%..100%)
  const getObjectPosition = useCallback(() => {
    // posX/posY range: -50 to 50, where 0 = center
    // object-position: 0% = show start edge, 50% = center, 100% = show end edge
    const opX = 50 + posX  // map -50..50 → 0..100
    const opY = 50 + posY
    return `${opX}% ${opY}%`
  }, [posX, posY])

  // --- Drag-to-pan ---
  const canPan = !!image && editable && naturalSize !== null

  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      if (!canPan) return
      // Don't start panning if the user clicked on a button, input, or other interactive element
      const target = e.target as HTMLElement
      if (target.closest('button, input, a, [role="button"]')) return
      const { overflowX, overflowY } = getOverflow()
      if (overflowX === 0 && overflowY === 0) return // nothing to pan
      e.preventDefault()
      e.stopPropagation()
      usePortfolioStore.getState()._pushHistory() // snapshot before drag
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, startX: posX, startY: posY }
    },
    [canPan, getOverflow, posX, posY]
  )

  useEffect(() => {
    if (!isPanning) return

    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const { overflowX, overflowY } = getOverflow()

      // Convert pixel delta to position delta
      // When overflowX = 0.5, the full pan range is 100 units (-50 to 50)
      // and we want dragging the full container width to move through the full range
      const sensitivity = 1.5
      const dx = overflowX > 0 ? -((e.clientX - panStart.current.x) / rect.width) * 100 * sensitivity : 0
      const dy = overflowY > 0 ? -((e.clientY - panStart.current.y) / rect.height) * 100 * sensitivity : 0

      const newX = Math.max(-50, Math.min(50, panStart.current.startX + dx))
      const newY = Math.max(-50, Math.min(50, panStart.current.startY + dy))
      updateTransform(newX, newY, zoom)
    }

    const handleUp = () => setIsPanning(false)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isPanning, zoom, updateTransform, getOverflow])

  // --- Zoom slider ---
  const zoomHistoryPushed = useRef(false)
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      if (!zoomHistoryPushed.current) {
        usePortfolioStore.getState()._pushHistory()
        zoomHistoryPushed.current = true
      }
      updateTransform(posX, posY, newZoom)
    },
    [posX, posY, updateTransform]
  )
  const handleZoomEnd = useCallback(() => { zoomHistoryPushed.current = false }, [])

  // --- File handling ---
  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImageDrop(reader.result)
          // Reset transform when new image is uploaded
          if (transformKey) {
            setImageTransform(transformKey, { x: 0, y: 0, zoom: 1 })
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // --- Image style ---
  const imageExtraStyle: CSSProperties = image
    ? {
        objectPosition: getObjectPosition(),
        transform: zoom > 1 ? `scale(${zoom})` : undefined,
        transformOrigin: getObjectPosition(),
        willChange: isPanning ? 'transform, object-position' : undefined,
      }
    : {}

  // Check if panning is possible (image overflows in at least one axis)
  const { overflowX, overflowY } = image && naturalSize ? getOverflow() : { overflowX: 0, overflowY: 0 }
  const hasPannableOverflow = overflowX > 0 || overflowY > 0

  const content = image ? (
    <img
      src={image}
      alt=""
      className={imgClassName}
      style={imageExtraStyle}
      draggable={false}
    />
  ) : (
    placeholder
  )

  if (!editable) {
    return (
      <div className={`${className} overflow-hidden`} style={style}>
        {image ? (
          <img
            src={image}
            alt=""
            className={imgClassName}
            style={imageExtraStyle}
            draggable={false}
          />
        ) : placeholder}
        {children}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`${className} relative overflow-hidden`}
      style={{ ...style, cursor: hasPannableOverflow ? (isPanning ? 'grabbing' : 'grab') : undefined }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false) }}
      onMouseDown={hasPannableOverflow ? handlePanStart : undefined}
    >
      {content}
      {children}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drag overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            border: '3px dashed rgba(59, 130, 246, 0.7)',
            borderRadius: 'inherit',
          }}
        >
          <span className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
            Drop image
          </span>
        </div>
      )}

      {/* Zoom slider — top-right, visible on hover when image exists */}
      {!hideControls && isHovered && !isDragging && !isPanning && image && (
        <div
          className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
            <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            onMouseUp={handleZoomEnd}
            onTouchEnd={handleZoomEnd}
            className="zoom-slider"
            style={{ width: '80px', height: '3px' }}
          />
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
            <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="7" y1="4.5" x2="7" y2="9.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Hover controls — center */}
      {!hideControls && isHovered && !isDragging && !isPanning && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center gap-2"
          style={{
            background: image ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }}
        >
          {image ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); openFilePicker() }}
                className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-zinc-800 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                style={{ pointerEvents: 'auto' }}
              >
                <RefreshCw size={12} />
                Replace
              </button>
              {onImageRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onImageRemove()
                    if (transformKey) {
                      setImageTransform(transformKey, { x: 0, y: 0, zoom: 1 })
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-red-500"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              )}
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); openFilePicker() }}
              className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2.5 text-xs font-medium text-zinc-800 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
              style={{ pointerEvents: 'auto' }}
            >
              <ImagePlus size={14} />
              Upload image
            </button>
          )}
        </div>
      )}
    </div>
  )
}
