import { Download, Save, Undo2, Redo2, Loader2 } from 'lucide-react'
import { useEffect, useRef, useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { usePortfolioStore } from '../../store/portfolio-store'
import { applyPalette } from '../../themes'
import { SlideFrame } from '../slides/SlideFrame'
import { SlideRenderer } from '../slides/SlideRenderer'
import { DrawingOverlay } from '../draw/DrawingOverlay'

function ModeTabBar({ appMode, setAppMode }: { appMode: 'design' | 'draw'; setAppMode: (m: 'design' | 'draw') => void }) {
  const barRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({ design: null, draw: null })
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const btn = btnRefs.current[appMode]
    if (btn && barRef.current) {
      const barRect = barRef.current.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      setIndicator({ left: btnRect.left - barRect.left, width: btnRect.width })
    }
  }, [appMode])

  return (
    <div ref={barRef} className="relative flex items-center gap-1">
      {(['design', 'draw'] as const).map((mode) => (
        <button
          key={mode}
          ref={(el) => { btnRefs.current[mode] = el }}
          onClick={() => setAppMode(mode)}
          className={`relative rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            appMode === mode ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
      {/* Sliding underline */}
      <div
        className="absolute bottom-0 h-0.5 rounded-full bg-white transition-all duration-200 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  )
}

function SaveButton() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveToFile = usePortfolioStore((s) => s.saveToFile)

  const handleSave = async () => {
    setStatus('saving')
    const ok = await saveToFile()
    setStatus(ok ? 'saved' : 'idle')
    if (ok) setTimeout(() => setStatus('idle'), 1500)
  }

  return (
    <button
      onClick={handleSave}
      disabled={status === 'saving'}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40"
      title="Save to repo"
    >
      <Save size={14} />
      {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved ✓' : 'Save'}
    </button>
  )
}

export function TopNav() {
  const slides = usePortfolioStore((s) => s.slides)
  const colorPaletteId = usePortfolioStore((s) => s.colorPaletteId)
  const headerFont = usePortfolioStore((s) => s.headerFont)
  const bodyFont = usePortfolioStore((s) => s.bodyFont)
  const slideRounding = usePortfolioStore((s) => s.slideRounding)
  const slidePadding = usePortfolioStore((s) => s.slidePadding)
  const headerUppercase = usePortfolioStore((s) => s.headerUppercase)
  const headerLetterSpacing = usePortfolioStore((s) => s.headerLetterSpacing)
  const undo = usePortfolioStore((s) => s.undo)
  const redo = usePortfolioStore((s) => s.redo)
  const canUndo = usePortfolioStore((s) => s.canUndo)
  const canRedo = usePortfolioStore((s) => s.canRedo)
  const appMode = usePortfolioStore((s) => s.appMode)
  const setAppMode = usePortfolioStore((s) => s.setAppMode)
  const [exporting, setExporting] = useState(false)



  const handleExport = async () => {
    if (slides.length === 0 || exporting) return
    setExporting(true)

    // Helper: load an image with timeout to prevent hanging
    const loadImage = (src: string, timeoutMs = 5000): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image()
        const timer = setTimeout(() => reject(new Error('Image load timeout')), timeoutMs)
        img.onload = () => { clearTimeout(timer); resolve(img) }
        img.onerror = () => { clearTimeout(timer); reject(new Error('Image load failed')) }
        img.src = src
      })

    let container: HTMLDivElement | null = null
    try {
      // Create an off-screen container to render slides at full resolution
      container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-10000px'
      container.style.top = '0'
      container.style.width = '1920px'
      container.style.zIndex = '-1'
      document.body.appendChild(container)

      // Apply palette
      applyPalette(colorPaletteId, headerFont, bodyFont, false, slideRounding, slidePadding, headerUppercase, headerLetterSpacing)

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
        hotfixes: ['px_scaling'],
      })

      for (let i = 0; i < slides.length; i++) {
        if (i > 0) pdf.addPage([1920, 1080], 'landscape')

        // Render slide into the off-screen container
        const slideDiv = document.createElement('div')
        slideDiv.style.width = '1920px'
        slideDiv.style.height = '1080px'
        slideDiv.style.overflow = 'hidden'
        container.appendChild(slideDiv)

        const root = createRoot(slideDiv)
        const texImg = usePortfolioStore.getState().textureImage
        const texBlend = usePortfolioStore.getState().textureBlendMode
        const texOpacity = usePortfolioStore.getState().textureOpacity

        root.render(
          <SlideFrame scale={1}>
            <div className="relative">
              <SlideRenderer slide={slides[i]} editable={false} />
              {(slides[i].drawingLayers?.length > 0) && (
                <DrawingOverlay slideId={slides[i].id} interactive={false} />
              )}
            </div>
          </SlideFrame>
        )

        // Wait for render + fonts
        await new Promise((r) => setTimeout(r, 200))

        // Capture the slide without texture first
        const slideDataUrl = await toJpeg(slideDiv, {
          width: 1920,
          height: 1080,
          pixelRatio: 1,
          quality: 0.95,
          cacheBust: true,
        })

        // If texture is set, composite it onto a canvas with the blend mode
        let finalDataUrl = slideDataUrl
        if (texImg) {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = 1920
            canvas.height = 1080
            const ctx = canvas.getContext('2d')!

            const slideImage = await loadImage(slideDataUrl)
            ctx.drawImage(slideImage, 0, 0, 1920, 1080)

            const texImage = await loadImage(texImg)
            ctx.globalCompositeOperation = texBlend as GlobalCompositeOperation
            ctx.globalAlpha = texOpacity

            // Flip texture per slide so consecutive slides look different
            const flipVariant = i % 4
            ctx.save()
            if (flipVariant === 1) { ctx.translate(1920, 0); ctx.scale(-1, 1) }        // flip H
            else if (flipVariant === 2) { ctx.translate(0, 1080); ctx.scale(1, -1) }    // flip V
            else if (flipVariant === 3) { ctx.translate(1920, 1080); ctx.scale(-1, -1) } // flip both
            ctx.drawImage(texImage, 0, 0, 1920, 1080)
            ctx.restore()

            finalDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          } catch {
            // Texture compositing failed — use slide without texture
          }
        }

        pdf.addImage(finalDataUrl, 'JPEG', 0, 0, 1920, 1080, undefined, 'FAST')

        // Add clickable link annotations for any <a> elements with href
        const anchors = slideDiv.querySelectorAll('a[href]')
        const slideRect = slideDiv.getBoundingClientRect()
        for (const anchor of anchors) {
          const href = anchor.getAttribute('href')
          if (!href || href === '#') continue
          const aRect = anchor.getBoundingClientRect()
          const x = aRect.left - slideRect.left
          const y = aRect.top - slideRect.top
          const w = aRect.width
          const h = aRect.height
          if (w > 0 && h > 0) {
            pdf.link(x, y, w, h, { url: href })
          }
        }

        root.unmount()
        container.removeChild(slideDiv)
      }

      document.body.removeChild(container)
      pdf.save('portfolio.pdf')
    } catch {
      // PDF export failed silently — user sees export button return to normal
    } finally {
      if (container && container.parentNode) {
        document.body.removeChild(container)
      }
      setExporting(false)
    }
  }

  return (
    <header className="no-print flex h-12 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      <ModeTabBar appMode={appMode} setAppMode={setAppMode} />

      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
          title="Undo (Cmd+Z)"
          aria-label="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
          title="Redo (Cmd+Shift+Z)"
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </button>

        <div className="mx-2 h-5 w-px bg-zinc-800" />

        <SaveButton />

        <button
          onClick={handleExport}
          disabled={slides.length === 0 || exporting}
          className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {exporting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>
    </header>
  )
}
