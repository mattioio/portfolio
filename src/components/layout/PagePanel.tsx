import { useState, useRef, useCallback } from 'react'
import { usePortfolioStore } from '../../store/portfolio-store'
import type {
  HeroContent,
  CVContent,
  BentoContent,
  CaseStudyContent,
  SignOffContent,
  SectionTitleContent,
} from '../../store/types'
import { ImageDropZone } from '../shared/ImageDropZone'
import { Plus, Minus, Trash2, Image, RotateCcw, GripVertical } from 'lucide-react'

/** Scrollable row of background images from the global library (Settings tab) */
function ExistingBackgrounds({ currentSlideId, onSelect }: { currentSlideId: string; onSelect: (url: string) => void }) {
  const backgroundLibrary = usePortfolioStore((s) => s.backgroundLibrary)

  const images = backgroundLibrary

  if (images.length === 0) return null

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[10px] text-zinc-600">Quick pick</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => onSelect(url)}
            className="h-12 w-16 flex-shrink-0 overflow-hidden rounded border border-zinc-700 transition-all hover:border-zinc-400"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
      {children}
    </p>
  )
}

function HeroSettings({
  slideId,
  content,
}: {
  slideId: string
  content: HeroContent
}) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  return (
    <div>
      <SectionLabel>Background image</SectionLabel>
      <ImageDropZone
        image={content.backgroundImage}
        onImageDrop={(url) => update(slideId, { backgroundImage: url } as any)}
        editable={true}
        className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-700"
        imgClassName="h-full w-full object-cover"
        placeholder={
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <Image size={20} />
            <span className="text-[10px]">Drop image here</span>
          </div>
        }
      />
      {content.backgroundImage && (
        <button
          onClick={() => update(slideId, { backgroundImage: '' } as any)}
          className="mt-1.5 text-[10px] text-red-400 hover:text-red-300"
        >
          Remove image
        </button>
      )}
      <ExistingBackgrounds currentSlideId={slideId} onSelect={(url) => update(slideId, { backgroundImage: url } as any)} />
    </div>
  )
}

function CVSettings({
  slideId,
  content,
}: {
  slideId: string
  content: CVContent
}) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  return (
    <div>
      <SectionLabel>Background image</SectionLabel>
      <ImageDropZone
        image={content.backgroundImage ?? ''}
        onImageDrop={(url) => update(slideId, { backgroundImage: url } as any)}
        onImageRemove={() => update(slideId, { backgroundImage: '' } as any)}
        editable={true}
        className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-700"
        imgClassName="h-full w-full object-cover"
        placeholder={
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <Image size={20} />
            <span className="text-[10px]">Drop image here</span>
          </div>
        }
      />
      {content.backgroundImage && (
        <button
          onClick={() => update(slideId, { backgroundImage: '' } as any)}
          className="mt-1.5 text-[10px] text-red-400 hover:text-red-300"
        >
          Remove image
        </button>
      )}
      <ExistingBackgrounds currentSlideId={slideId} onSelect={(url) => update(slideId, { backgroundImage: url } as any)} />
    </div>
  )
}

function BentoSettings({
  slideId,
  content,
}: {
  slideId: string
  content: BentoContent
}) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  return (
    <div className="flex flex-col gap-4">
      {/* Blurb toggle */}
      <div>
        <SectionLabel>Options</SectionLabel>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-700 px-3 py-2.5">
            <span className="text-xs text-zinc-300">Show blurbs</span>
            <div
              className={`relative h-5 w-9 rounded-full transition-colors ${
                content.showBlurbs !== false ? 'bg-blue-500' : 'bg-zinc-700'
              }`}
              onClick={() =>
                update(slideId, { showBlurbs: !(content.showBlurbs !== false) } as any)
              }
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  content.showBlurbs !== false ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </div>
    </div>
  )
}

function SectionTitleSettings({
  slideId,
  content,
}: {
  slideId: string
  content: SectionTitleContent
}) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const showBlurb = content.showBlurb ?? false
  const showCta = content.showCta ?? false

  return (
    <div className="flex flex-col gap-4">
      {/* Content toggles */}
      <div>
        <SectionLabel>Content</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {/* Show blurb toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-700 px-3 py-2.5">
            <span className="text-xs text-zinc-300">Show blurb</span>
            <div
              className={`relative h-5 w-9 rounded-full transition-colors ${showBlurb ? 'bg-blue-500' : 'bg-zinc-700'}`}
              onClick={() => {
                usePortfolioStore.getState()._pushHistory(true)
                update(slideId, { showBlurb: !showBlurb } as any)
              }}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showBlurb ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </label>
          {/* Show CTA toggle */}
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-700 px-3 py-2.5">
            <span className="text-xs text-zinc-300">Show CTA</span>
            <div
              className={`relative h-5 w-9 rounded-full transition-colors ${showCta ? 'bg-blue-500' : 'bg-zinc-700'}`}
              onClick={() => {
                usePortfolioStore.getState()._pushHistory(true)
                update(slideId, { showCta: !showCta } as any)
              }}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showCta ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </label>
          {/* CTA link input (shown when CTA is on) */}
          {showCta && (
            <input
              type="url"
              placeholder="https://link-url.com"
              value={content.ctaUrl ?? ''}
              onChange={(e) => update(slideId, { ctaUrl: e.target.value } as any)}
              className="rounded-lg border border-zinc-700 bg-transparent px-3 py-2 text-xs text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />
          )}
        </div>
      </div>

      {/* Background image */}
      <div>
        <SectionLabel>Background image</SectionLabel>
        <ImageDropZone
          image={content.backgroundImage ?? ''}
          onImageDrop={(url) => update(slideId, { backgroundImage: url } as any)}
          onImageRemove={() => update(slideId, { backgroundImage: '' } as any)}
          editable={true}
          className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-700"
          imgClassName="h-full w-full object-cover"
          placeholder={
            <div className="flex flex-col items-center gap-2 text-zinc-600">
              <Image size={20} />
              <span className="text-[10px]">Drop image here</span>
            </div>
          }
        />
        {content.backgroundImage && (
          <button
            onClick={() => update(slideId, { backgroundImage: '' } as any)}
            className="mt-1.5 text-[10px] text-red-400 hover:text-red-300"
          >
            Remove image
          </button>
        )}
        <ExistingBackgrounds currentSlideId={slideId} onSelect={(url) => update(slideId, { backgroundImage: url } as any)} />
      </div>
    </div>
  )
}

function CaseStudySettings({
  slideId,
  content,
}: {
  slideId: string
  content: CaseStudyContent
}) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SectionLabel>Background image</SectionLabel>
        <ImageDropZone
          image={content.backgroundImage ?? ''}
          onImageDrop={(url) => update(slideId, { backgroundImage: url } as any)}
          onImageRemove={() => update(slideId, { backgroundImage: '' } as any)}
          editable={true}
          className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-700"
          imgClassName="h-full w-full object-cover"
          placeholder={
            <div className="flex flex-col items-center gap-2 text-zinc-600">
              <Image size={20} />
              <span className="text-[10px]">Drop image here</span>
            </div>
          }
        />
        {content.backgroundImage && (
          <button
            onClick={() => update(slideId, { backgroundImage: '' } as any)}
            className="mt-1.5 text-[10px] text-red-400 hover:text-red-300"
          >
            Remove image
          </button>
        )}
        <ExistingBackgrounds currentSlideId={slideId} onSelect={(url) => update(slideId, { backgroundImage: url } as any)} />
      </div>

      <div>
        <SectionLabel>Link URL</SectionLabel>
        <input
          type="url"
          value={content.linkUrl ?? ''}
          onChange={(e) => update(slideId, { linkUrl: e.target.value } as any)}
          placeholder="https://..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>
    </div>
  )
}

function SignOffSettings({
  slideId,
  content,
}: {
  slideId: string
  content: SignOffContent
}) {
  const update = usePortfolioStore((s) => s.updateSlideContent)

  const addLink = () => {
    const links = [...content.links, { label: 'Link', url: '' }]
    update(slideId, { links } as any)
  }

  const removeLink = (index: number) => {
    const links = content.links.filter((_, i) => i !== index)
    update(slideId, { links } as any)
  }

  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    const links = [...content.links]
    links[index] = { ...links[index], [field]: value }
    update(slideId, { links } as any)
  }

  const dragIdx = useRef<number | null>(null)
  const reorderLinks = useCallback((from: number, to: number) => {
    if (from === to) return
    const links = [...content.links]
    const [moved] = links.splice(from, 1)
    links.splice(to, 0, moved)
    update(slideId, { links } as any)
  }, [content.links, slideId, update])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SectionLabel>Background image</SectionLabel>
        <ImageDropZone
          image={content.backgroundImage ?? ''}
          onImageDrop={(url) => update(slideId, { backgroundImage: url } as any)}
          onImageRemove={() => update(slideId, { backgroundImage: '' } as any)}
          editable={true}
          className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-700"
          imgClassName="h-full w-full object-cover"
          placeholder={
            <div className="flex flex-col items-center gap-2 text-zinc-600">
              <Image size={20} />
              <span className="text-[10px]">Drop image here</span>
            </div>
          }
        />
        {content.backgroundImage && (
          <button
            onClick={() => update(slideId, { backgroundImage: '' } as any)}
            className="mt-1.5 text-[10px] text-red-400 hover:text-red-300"
          >
            Remove image
          </button>
        )}
        <ExistingBackgrounds currentSlideId={slideId} onSelect={(url) => update(slideId, { backgroundImage: url } as any)} />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>Links</SectionLabel>
        <button
          onClick={addLink}
          className="rounded p-1 text-zinc-500 hover:text-zinc-300"
          title="Add link"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {content.links.map((link, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => { dragIdx.current = i }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={() => { if (dragIdx.current !== null) { reorderLinks(dragIdx.current, i); dragIdx.current = null } }}
            onDragEnd={() => { dragIdx.current = null }}
            className="rounded-lg border border-zinc-700 p-2"
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <div className="cursor-grab touch-none text-zinc-600 hover:text-zinc-400 active:cursor-grabbing">
                <GripVertical size={12} />
              </div>
              <input
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                placeholder="Label"
                className="flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              <button
                onClick={() => removeLink(i)}
                className="ml-2 rounded p-0.5 text-zinc-600 hover:text-red-400"
              >
                <Trash2 size={10} />
              </button>
            </div>
            <input
              value={link.url}
              onChange={(e) => updateLink(i, 'url', e.target.value)}
              placeholder="https://..."
              className="w-full bg-transparent pl-[22px] text-[10px] text-zinc-400 outline-none placeholder:text-zinc-600"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Work History settings removed — timeline entries are derived from CV slides

function ResetButton({ slideId }: { slideId: string }) {
  const resetSlideContent = usePortfolioStore((s) => s.resetSlideContent)
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-3">
        <p className="flex-1 text-[11px] text-red-300">Reset all content to defaults?</p>
        <button
          onClick={() => { resetSlideContent(slideId); setConfirming(false) }}
          className="rounded-md bg-red-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-400"
        >
          Reset
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
    >
      <RotateCcw size={12} />
      Reset content
    </button>
  )
}

export function PagePanel() {
  const selectedSlideId = usePortfolioStore((s) => s.selectedSlideId)
  const slide = usePortfolioStore((s) =>
    s.slides.find((sl) => sl.id === s.selectedSlideId)
  )
  const setSlideStyleVariant = usePortfolioStore((s) => s.setSlideStyleVariant)
  const toggleSlideDarkMode = usePortfolioStore((s) => s.toggleSlideDarkMode)
  const setSlideHeadingSizeStep = usePortfolioStore((s) => s.setSlideHeadingSizeStep)
  const setSlideBodSizeStep = usePortfolioStore((s) => s.setSlideBodSizeStep)

  if (!slide) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-xs text-zinc-500">No slide selected</p>
        <p className="text-[10px] text-zinc-600">
          Select a slide to edit its settings
        </p>
      </div>
    )
  }

  const bentoImageCount = slide.type === 'bento' ? (slide.content as BentoContent).layoutVariant : 0

  const slideType =
    slide.type === 'bento'
      ? `Bento ${bentoImageCount}`
      : slide.type === 'section-title'
        ? 'Section Title'
        : slide.type === 'cv'
          ? 'Places Worked'
          : slide.type === 'work-history'
            ? 'Work History'
            : slide.type === 'case-study'
              ? 'Case Study'
              : slide.type === 'sign-off'
                ? 'Sign Off'
                : slide.type.charAt(0).toUpperCase() + slide.type.slice(1)

  const currentVariant = slide.styleVariant ?? 0
  const isDark = slide.darkMode ?? false

  return (
    <div className="flex flex-col gap-5 p-3">
      <p className="text-xs font-medium text-zinc-400">{slideType}</p>

      {/* Layout variant selector (hidden for Bento 1 — only one layout) */}
      {!(slide.type === 'bento' && bentoImageCount <= 1) && (
        <div>
          <SectionLabel>Layout</SectionLabel>
          <div className="flex gap-1">
            {['A', 'B', 'C', 'D'].map((label, i) => (
              <button
                key={label}
                onClick={() => setSlideStyleVariant(slide.id, i)}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                  currentVariant === i
                    ? 'bg-white text-zinc-900'
                    : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dark mode toggle */}
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-700 px-3 py-2.5">
          <span className="text-xs text-zinc-300">Dark mode</span>
          <div
            className={`relative h-5 w-9 rounded-full transition-colors ${isDark ? 'bg-blue-500' : 'bg-zinc-700'}`}
            onClick={() => toggleSlideDarkMode(slide.id)}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      {/* Text size steppers */}
      <div>
        <SectionLabel>Text size</SectionLabel>
        <div className="flex flex-col gap-2">
          {/* Headings stepper */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-2">
            <span className="text-xs text-zinc-300">Headings</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSlideHeadingSizeStep(slide.id, (slide.headingSizeStep ?? 0) - 1)}
                disabled={(slide.headingSizeStep ?? 0) <= 0}
                className="rounded p-1 text-zinc-400 transition-colors hover:text-white disabled:opacity-25 disabled:hover:text-zinc-400"
                aria-label="Decrease heading size"
              >
                <Minus size={12} />
              </button>
              <span className="w-5 text-center text-xs tabular-nums text-zinc-400">
                {slide.headingSizeStep ?? 0}
              </span>
              <button
                onClick={() => setSlideHeadingSizeStep(slide.id, (slide.headingSizeStep ?? 0) + 1)}
                disabled={(slide.headingSizeStep ?? 0) >= 3}
                className="rounded p-1 text-zinc-400 transition-colors hover:text-white disabled:opacity-25 disabled:hover:text-zinc-400"
                aria-label="Increase heading size"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          {/* Body copy stepper */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-2">
            <span className="text-xs text-zinc-300">Body copy</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSlideBodSizeStep(slide.id, (slide.bodySizeStep ?? 0) - 1)}
                disabled={(slide.bodySizeStep ?? 0) <= 0}
                className="rounded p-1 text-zinc-400 transition-colors hover:text-white disabled:opacity-25 disabled:hover:text-zinc-400"
                aria-label="Decrease body text size"
              >
                <Minus size={12} />
              </button>
              <span className="w-5 text-center text-xs tabular-nums text-zinc-400">
                {slide.bodySizeStep ?? 0}
              </span>
              <button
                onClick={() => setSlideBodSizeStep(slide.id, (slide.bodySizeStep ?? 0) + 1)}
                disabled={(slide.bodySizeStep ?? 0) >= 3}
                className="rounded p-1 text-zinc-400 transition-colors hover:text-white disabled:opacity-25 disabled:hover:text-zinc-400"
                aria-label="Increase body text size"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {slide.type === 'section-title' && (
        <SectionTitleSettings slideId={slide.id} content={slide.content as SectionTitleContent} />
      )}
      {slide.type === 'hero' && (
        <HeroSettings slideId={slide.id} content={slide.content as HeroContent} />
      )}
      {slide.type === 'cv' && (
        <CVSettings slideId={slide.id} content={slide.content as CVContent} />
      )}
      {slide.type === 'bento' && (
        <BentoSettings slideId={slide.id} content={slide.content as BentoContent} />
      )}
      {slide.type === 'case-study' && (
        <CaseStudySettings slideId={slide.id} content={slide.content as CaseStudyContent} />
      )}
      {slide.type === 'sign-off' && (
        <SignOffSettings slideId={slide.id} content={slide.content as SignOffContent} />
      )}

      {/* Reset content */}
      <ResetButton slideId={slide.id} />
    </div>
  )
}
