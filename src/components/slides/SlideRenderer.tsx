import { memo, useRef, useEffect, useState, useCallback } from 'react'
import type { Slide } from '../../store/types'
import { usePortfolioStore } from '../../store/portfolio-store'
import { paletteMap, COLOR_PALETTES } from '../../themes'
import { HeroSlide } from './templates/HeroSlide'
import { AboutSlide } from './templates/AboutSlide'
import { SectionTitleSlide } from './templates/SectionTitleSlide'
import { CVSlide } from './templates/CVSlide'
import { CaseStudySlide } from './templates/CaseStudySlide'
import { BentoSlide } from './templates/BentoSlide'
import { WorkHistorySlide } from './templates/WorkHistorySlide'
import { SignOffSlide } from './templates/SignOffSlide'

interface SlideRendererProps {
  slide: Slide
  editable?: boolean
}

/**
 * Sample the average luminance of the bottom strip of the slide container.
 * Finds all <img> elements that intersect the footer region, draws them
 * onto a tiny offscreen canvas, and returns 0–1 luminance.
 */
/**
 * Sample the average luminance of the bottom strip of the slide.
 * Checks images first, then falls back to computed background color
 * of the element at the footer position.
 */
function sampleFooterLuminance(container: HTMLElement): number {
  const footerHeight = 60
  const rect = container.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return 1 // assume light

  const scale = 1920 / rect.width
  const footerTop = rect.bottom - (footerHeight / scale)

  // Try sampling images that overlap the footer region
  const imgs = container.querySelectorAll('img')
  if (imgs.length > 0) {
    const canvas = document.createElement('canvas')
    const sampleW = 200
    const sampleH = 20
    canvas.width = sampleW
    canvas.height = sampleH
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      let hasContent = false
      for (const img of imgs) {
        if (!img.complete || img.naturalWidth === 0) continue
        const imgRect = img.getBoundingClientRect()
        if (imgRect.bottom < footerTop || imgRect.top > rect.bottom) continue
        try {
          const imgScaleY = img.naturalHeight / imgRect.height
          const srcY = Math.max(0, (footerTop - imgRect.top) * imgScaleY)
          const srcH = Math.min(img.naturalHeight - srcY, footerHeight / scale * imgScaleY)
          if (srcH <= 0) continue
          ctx.drawImage(img, 0, srcY, img.naturalWidth, srcH, 0, 0, sampleW, sampleH)
          hasContent = true
        } catch { /* CORS */ }
      }
      if (hasContent) {
        const imageData = ctx.getImageData(0, 0, sampleW, sampleH)
        const data = imageData.data
        let totalLum = 0
        let pixelCount = 0
        for (let i = 0; i < data.length; i += 16) {
          if (data[i + 3] < 25) continue
          totalLum += 0.299 * data[i] / 255 + 0.587 * data[i + 1] / 255 + 0.114 * data[i + 2] / 255
          pixelCount++
        }
        if (pixelCount > 0) return totalLum / pixelCount
      }
    }
  }

  // Fallback: walk up the container tree to find a non-transparent background
  let el: HTMLElement | null = container
  // First check the slide's direct child (the actual template root)
  const slideRoot = container.querySelector('[style*="background"]') as HTMLElement | null
  if (slideRoot) el = slideRoot

  while (el) {
    const bg = getComputedStyle(el).backgroundColor
    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/)
    if (match) {
      const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1
      if (alpha > 0.5) {
        const r = parseInt(match[1]) / 255
        const g = parseInt(match[2]) / 255
        const b = parseInt(match[3]) / 255
        return 0.299 * r + 0.587 * g + 0.114 * b
      }
    }
    el = el.parentElement
  }

  return 1 // default to light
}

/** Footer for thumbnails / exports — does a one-shot luminance check */
const SlideFooterStatic = memo(function SlideFooterStatic({ darkMode, containerRef }: { darkMode: boolean; containerRef?: React.RefObject<HTMLDivElement | null> }) {
  const footerName = usePortfolioStore((s) => s.footerName)
  const footerTitle = usePortfolioStore((s) => s.footerTitle)
  const footerShowYear = usePortfolioStore((s) => s.footerShowYear)
  const year = new Date().getFullYear()
  const [isOverDark, setIsOverDark] = useState(darkMode)

  useEffect(() => {
    if (!containerRef?.current) { setIsOverDark(darkMode); return }
    // One-shot luminance checks — enough for static renders
    const timers = [
      setTimeout(() => {
        if (containerRef.current) {
          const lum = sampleFooterLuminance(containerRef.current)
          setIsOverDark(lum < 0.45)
        }
      }, 150),
      setTimeout(() => {
        if (containerRef.current) {
          const lum = sampleFooterLuminance(containerRef.current)
          setIsOverDark(lum < 0.45)
        }
      }, 600),
    ]
    return () => timers.forEach(clearTimeout)
  }, [darkMode, containerRef])

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 flex justify-between pointer-events-none"
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: isOverDark
          ? 'rgba(255, 255, 255, 0.55)'
          : 'var(--color-text)',
        opacity: isOverDark ? 1 : 0.4,
        padding: '32px 40px',
      }}
    >
      <span>{footerName}</span>
      <span>{footerTitle}{footerShowYear ? ` - ${year}` : ''}</span>
    </div>
  )
})

function SlideFooter({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const footerName = usePortfolioStore((s) => s.footerName)
  const footerTitle = usePortfolioStore((s) => s.footerTitle)
  const footerShowYear = usePortfolioStore((s) => s.footerShowYear)
  const year = new Date().getFullYear()

  const [isOverDark, setIsOverDark] = useState(false)

  const checkLuminance = useCallback(() => {
    if (!containerRef.current) return
    const lum = sampleFooterLuminance(containerRef.current)
    setIsOverDark(lum < 0.45)
  }, [containerRef])

  useEffect(() => {
    // Check multiple times to catch late-loading images
    const timers = [
      setTimeout(checkLuminance, 100),
      setTimeout(checkLuminance, 500),
      setTimeout(checkLuminance, 1500),
    ]
    const container = containerRef.current
    if (container) {
      const observer = new MutationObserver(() => {
        setTimeout(checkLuminance, 50)
      })
      observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'style'] })
      const handleLoad = () => setTimeout(checkLuminance, 50)
      container.addEventListener('load', handleLoad, true)
      return () => {
        timers.forEach(clearTimeout)
        observer.disconnect()
        container.removeEventListener('load', handleLoad, true)
      }
    }
    return () => timers.forEach(clearTimeout)
  }, [checkLuminance])

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 flex justify-between pointer-events-none"
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: isOverDark
          ? 'rgba(255, 255, 255, 0.55)'
          : 'var(--color-text)',
        opacity: isOverDark ? 1 : 0.4,
        padding: '32px 40px',
      }}
    >
      <span>{footerName}</span>
      <span>{footerTitle}{footerShowYear ? ` - ${year}` : ''}</span>
    </div>
  )
}

export function SlideRenderer({ slide, editable = false }: SlideRendererProps) {
  const colorPaletteId = usePortfolioStore((s) => s.colorPaletteId)
  const isDark = slide.darkMode ?? false
  const props = {
    slideId: slide.id, editable, styleVariant: slide.styleVariant ?? 0, darkMode: isDark,
    headingSizeStep: slide.headingSizeStep ?? 0, bodySizeStep: slide.bodySizeStep ?? 0,
  }
  const containerRef = useRef<HTMLDivElement>(null)

  // When darkMode is on, override CSS vars with the dark palette for this slide
  const darkOverrides = isDark ? (() => {
    const palette = paletteMap[colorPaletteId] ?? COLOR_PALETTES[0]
    const c = palette.dark
    return {
      '--color-background': c.background,
      '--color-surface': c.surface,
      '--color-surface-alt': c.surfaceAlt,
      '--color-primary': c.primary,
      '--color-secondary': c.secondary,
      '--color-accent': c.accent,
      '--color-text': c.text,
      '--color-text-muted': c.textMuted,
      '--color-text-on-dark': c.textOnDark,
      '--color-border': c.border,
      '--color-card-dark': c.cardDark,
      '--color-card-dark-text': c.cardDarkText,
      '--color-badge': c.badge,
      '--color-badge-text': c.badgeText,
    } as React.CSSProperties
  })() : undefined

  let slideContent: React.ReactNode
  switch (slide.type) {
    case 'hero':
      slideContent = <HeroSlide content={slide.content as any} {...props} />; break
    case 'about':
      slideContent = <AboutSlide content={slide.content as any} {...props} />; break
    case 'section-title':
      slideContent = <SectionTitleSlide content={slide.content as any} {...props} />; break
    case 'cv':
      slideContent = <CVSlide content={slide.content as any} {...props} />; break
    case 'work-history':
      slideContent = <WorkHistorySlide content={slide.content as any} {...props} />; break
    case 'case-study':
      slideContent = <CaseStudySlide content={slide.content as any} {...props} />; break
    case 'bento':
      slideContent = <BentoSlide content={slide.content as any} {...props} />; break
    case 'sign-off':
      slideContent = <SignOffSlide content={slide.content as any} {...props} />; break
  }

  const inner = (
    <div ref={containerRef} className="relative">
      {slideContent}
      {editable ? (
        <SlideFooter containerRef={containerRef} />
      ) : (
        <SlideFooterStatic darkMode={isDark} containerRef={containerRef} />
      )}
    </div>
  )

  if (darkOverrides) {
    return <div style={darkOverrides}>{inner}</div>
  }

  return inner
}
