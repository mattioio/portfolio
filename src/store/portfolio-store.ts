import { create } from 'zustand'
import { persist, type StateStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Slide, SlideType, SlideContent, BentoContent, ImageTransform, CVContent, DrawingPath, DrawingLayer, DrawingGroup } from './types'
import { idbStorage } from './idb-storage'

// ── Save to repo: Cmd+S writes state to portfolio-data.json via dev server ──
async function saveToRepo(state: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state, null, 2),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Seed from repo: on first load with empty IDB, hydrate from portfolio-data.json ──
async function loadSeedData(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch('/portfolio-data.json')
    if (!res.ok) return null
    const data = await res.json()
    return data?.state ?? data ?? null
  } catch {
    return null
  }
}

const BENTO_DEFAULT_DESCRIPTIONS: string[] = [
  'Charity profile page',
  'Donation impact calculator',
  'Fundraiser listing',
  'Mobile donation flow',
  'Dashboard overview',
]

function getDefaultContent(type: SlideType, layoutVariant?: number): SlideContent {
  switch (type) {
    case 'hero':
      return {
        type: 'hero',
        title: 'PORTFOLIO',
        subtitle: '',
        name: 'Matthew O\'Connor',
        role: `Product designer - ${new Date().getFullYear()}`,
        backgroundImage: '',
      }
    case 'about':
      return {
        type: 'about',
        heading: 'About me',
        paragraphs: [
          "I'm a pragmatic digital product designer with over a decade of experience. I thrive on working hand-in-hand with developers to create user focused UIs for both the web & apps.",
          "Crafting great user experiences by merging design and development is where my passion truly lies. I'm now looking for new opportunities to blend design and development seamlessly within a new team.",
        ],
        image: '',
        name: 'Matthew O\'Connor',
        role: `Product designer - ${new Date().getFullYear()}`,
      }
    case 'section-title':
      return {
        type: 'section-title',
        heading: 'Places I\'ve made an impact',
        blurb: 'A short description about this section.',
        showBlurb: false,
        ctaLabel: 'Learn more',
        ctaUrl: '',
        showCta: false,
        backgroundImage: '',
      }
    case 'cv':
      return {
        type: 'cv',
        company: 'Company Name',
        logo: '',
        roleBadge: 'Senior product designer',
        dateRange: '2024–present',
        roleType: 'Current role',
        description:
          'A brief description of the company and your role. Describe the impact you made and the team you worked with.\n- Implemented design system, improving consistency and developer collaboration\n- Redesigned key pages to better communicate value proposition\n- Added new features to increase visibility and trust',
        bullets: [],
        image: '',
        backgroundImage: '',
      }
    case 'work-history': {
      // Pull entries from existing CV slides if available
      return {
        type: 'work-history',
        heading: 'Work History',
        entries: [
          { company: 'Company Name', role: 'Senior Product Designer', dateRange: '2024–present' },
          { company: 'Previous Co', role: 'Product Designer', dateRange: '2021–2024' },
          { company: 'First Job', role: 'Junior Designer', dateRange: '2018–2021' },
        ],
      }
    }
    case 'case-study':
      return {
        type: 'case-study',
        number: 'CASE STUDY #1',
        heading: 'A new home for charities',
        description:
          'As the product grew in features and functionality, the experience needed to evolve alongside it. We had many great features, but lacked a public profile to bring it all together.',
        linkText: 'Read more',
        linkUrl: '',
        images: [],
        backgroundImage: '',
      }
    case 'bento': {
      // layoutVariant = image count (1–4)
      const imageCount = Math.max(1, Math.min(5, layoutVariant ?? 2))
      const items = Array.from({ length: imageCount }, (_, i) => ({
        image: '',
        description: BENTO_DEFAULT_DESCRIPTIONS[i] ?? `Image ${i + 1}`,
      }))
      return {
        type: 'bento',
        items,
        layoutVariant: imageCount,
        showBlurbs: true,
      }
    }
    case 'sign-off':
      return {
        type: 'sign-off',
        heading: 'Thanks for reading',
        subheading: "Let's work together",
        email: 'hello@example.com',
        links: [
          { label: 'LinkedIn', url: '#' },
          { label: 'Dribbble', url: '#' },
          { label: 'GitHub', url: '#' },
        ],
        backgroundImage: '',
      }
  }
}

const MAX_HISTORY = 50
let _lastHistoryPush = 0
const HISTORY_THROTTLE_MS = 300

interface HistorySnapshot {
  slides: Slide[]
  selectedSlideId: string | null
  // Global settings (so theme/font/texture changes are undoable)
  colorPaletteId?: string
  headerFont?: string
  bodyFont?: string
  footerName?: string
  footerTitle?: string
  footerShowYear?: boolean
  headerUppercase?: boolean
  headerLetterSpacing?: number
  slidePadding?: number
  slideRounding?: number
  textureImage?: string
  textureBlendMode?: string
  textureOpacity?: number
  backgroundLibrary?: string[]
  imageTransforms?: Record<string, ImageTransform>
}

interface PortfolioState {
  slides: Slide[]
  selectedSlideId: string | null
  colorPaletteId: string
  headerFont: string
  bodyFont: string
  footerName: string
  footerTitle: string
  footerShowYear: boolean
  headerUppercase: boolean
  headerLetterSpacing: number  // -0.05 to 0.1 em
  slidePadding: number    // 0-80 px inset around slide content
  slideRounding: number   // 0-40 px border-radius on elements
  backgroundLibrary: string[]  // global background image library
  textureImage: string          // base64 texture overlay image
  textureBlendMode: string      // CSS mix-blend-mode
  textureOpacity: number        // 0-1
  setTextureImage: (url: string) => void
  setTextureBlendMode: (mode: string) => void
  setTextureOpacity: (opacity: number) => void
  addBackgroundToLibrary: (url: string) => void
  removeBackgroundFromLibrary: (url: string) => void

  // History
  _history: HistorySnapshot[]
  _future: HistorySnapshot[]
  _pushHistory: (force?: boolean) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  addSlide: (type: SlideType, options?: { layoutVariant?: number }) => void
  removeSlide: (id: string) => void
  duplicateSlide: (id: string) => void
  reorderSlides: (activeId: string, overId: string) => void
  selectSlide: (id: string) => void
  updateSlideContent: (id: string, content: Partial<SlideContent>) => void
  resetSlideContent: (id: string) => void
  setSlideStyleVariant: (id: string, variant: number) => void
  toggleSlideDarkMode: (id: string) => void
  setSlideHeadingSizeStep: (id: string, step: number) => void
  setSlideBodSizeStep: (id: string, step: number) => void

  imageTransforms: Record<string, ImageTransform>
  setImageTransform: (key: string, transform: ImageTransform) => void

  isFullscreen: boolean
  toggleFullscreen: () => void

  addSlideSheetOpen: boolean
  setAddSlideSheetOpen: (open: boolean) => void

  // Draw mode
  appMode: 'design' | 'draw'
  setAppMode: (mode: 'design' | 'draw') => void
  selectedDrawingLayerIds: string[]
  selectDrawingLayer: (id: string | null) => void
  toggleDrawingLayerSelection: (id: string) => void // shift+click
  drawTool: 'pen' | 'eraser' | 'hand' | 'shape'
  drawStrokeWidth: number
  drawStrokeColor: string
  setDrawTool: (tool: 'pen' | 'eraser' | 'hand' | 'shape') => void
  drawShapeType: string
  drawShapeFilled: boolean
  setDrawShapeType: (shape: string) => void
  setDrawShapeFilled: (filled: boolean) => void
  drawShapePickerOpen: boolean
  setDrawShapePickerOpen: (open: boolean) => void
  setDrawStrokeWidth: (w: number) => void
  setDrawStrokeColor: (c: string) => void
  addDrawingLayer: (slideId: string) => void
  removeDrawingLayer: (slideId: string, layerId: string) => void
  toggleDrawingLayerVisibility: (slideId: string, layerId: string) => void
  addPathToLayer: (slideId: string, layerId: string, path: DrawingPath) => void
  removePathFromLayer: (slideId: string, layerId: string, pathIndex: number) => void
  updateDrawingLayerTransform: (slideId: string, layerId: string, rotation: number, scale: number, scaleX?: number, scaleY?: number) => void
  setDrawingLayerOpacity: (slideId: string, layerId: string, opacity: number) => void
  moveDrawingLayer: (slideId: string, layerId: string, offsetX: number, offsetY: number) => void
  recolorDrawingLayer: (slideId: string, layerId: string, color: string) => void
  restrokeDrawingLayer: (slideId: string, layerId: string, width: number) => void
  renameDrawingLayer: (slideId: string, layerId: string, name: string) => void
  reorderDrawingLayers: (slideId: string, fromIndex: number, toIndex: number, targetGroupId?: string | null) => void
  duplicateDrawingLayer: (slideId: string, layerId: string, inPlace?: boolean) => void
  removeSelectedDrawingLayers: (slideId: string) => void
  groupDrawingLayers: (slideId: string) => void
  ungroupDrawingLayers: (slideId: string) => void
  selectGroup: (slideId: string, groupId: string) => void
  renameGroup: (slideId: string, groupId: string, name: string) => void
  removeGroup: (slideId: string, groupId: string) => void
  duplicateGroup: (slideId: string, groupId: string) => void
  moveGroup: (slideId: string, groupId: string, dx: number, dy: number) => void
  reorderGroup: (slideId: string, groupId: string, direction: 'up' | 'down') => void

  saveToFile: () => Promise<boolean>

  setColorPalette: (id: string) => void
  setHeaderFont: (font: string) => void
  setBodyFont: (font: string) => void
  setFooterName: (name: string) => void
  setFooterTitle: (title: string) => void
  setFooterShowYear: (show: boolean) => void
  setHeaderUppercase: (v: boolean) => void
  setHeaderLetterSpacing: (v: number) => void
  setSlidePadding: (v: number) => void
  setSlideRounding: (v: number) => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      slides: [],
      selectedSlideId: null,
      colorPaletteId: 'mono',
      headerFont: "'Archivo Variable', sans-serif",
      bodyFont: "'Inter Variable', sans-serif",
      footerName: "Matthew O'Connor",
      footerTitle: 'Product designer',
      footerShowYear: true,
      headerUppercase: false,
      headerLetterSpacing: 0,
      slidePadding: 0,
      slideRounding: 6,
      backgroundLibrary: [],
      textureImage: '',
      textureBlendMode: 'overlay',
      textureOpacity: 0.3,
      setTextureImage: (url) => { get()._pushHistory(); set({ textureImage: url }) },
      setTextureBlendMode: (mode) => { get()._pushHistory(); set({ textureBlendMode: mode }) },
      setTextureOpacity: (opacity) => { get()._pushHistory(); set({ textureOpacity: opacity }) },

      _history: [],
      _future: [],

      _pushHistory: (force?: boolean) => {
        // Throttle rapid pushes (e.g. slider drags) to avoid flooding the stack
        const now = Date.now()
        if (!force && now - _lastHistoryPush < HISTORY_THROTTLE_MS) return
        _lastHistoryPush = now
        const state = get()
        const snapshot: HistorySnapshot = {
          slides: JSON.parse(JSON.stringify(state.slides)),
          selectedSlideId: state.selectedSlideId,
          colorPaletteId: state.colorPaletteId,
          headerFont: state.headerFont,
          bodyFont: state.bodyFont,
          footerName: state.footerName,
          footerTitle: state.footerTitle,
          footerShowYear: state.footerShowYear,
          headerUppercase: state.headerUppercase,
          headerLetterSpacing: state.headerLetterSpacing,
          slidePadding: state.slidePadding,
          slideRounding: state.slideRounding,
          textureImage: state.textureImage,
          textureBlendMode: state.textureBlendMode,
          textureOpacity: state.textureOpacity,
          backgroundLibrary: [...state.backgroundLibrary],
          imageTransforms: JSON.parse(JSON.stringify(state.imageTransforms)),
        }
        set({
          _history: [...state._history.slice(-MAX_HISTORY), snapshot],
          _future: [],
        })
      },

      undo: () => {
        const state = get()
        if (state._history.length === 0) return
        const prev = state._history[state._history.length - 1]
        const currentSnapshot: HistorySnapshot = {
          slides: JSON.parse(JSON.stringify(state.slides)),
          selectedSlideId: state.selectedSlideId,
          colorPaletteId: state.colorPaletteId,
          headerFont: state.headerFont,
          bodyFont: state.bodyFont,
          footerName: state.footerName,
          footerTitle: state.footerTitle,
          footerShowYear: state.footerShowYear,
          headerUppercase: state.headerUppercase,
          headerLetterSpacing: state.headerLetterSpacing,
          slidePadding: state.slidePadding,
          slideRounding: state.slideRounding,
          textureImage: state.textureImage,
          textureBlendMode: state.textureBlendMode,
          textureOpacity: state.textureOpacity,
          backgroundLibrary: [...state.backgroundLibrary],
          imageTransforms: JSON.parse(JSON.stringify(state.imageTransforms)),
        }
        set({
          slides: prev.slides,
          selectedSlideId: prev.selectedSlideId,
          ...(prev.colorPaletteId !== undefined && { colorPaletteId: prev.colorPaletteId }),
          ...(prev.headerFont !== undefined && { headerFont: prev.headerFont }),
          ...(prev.bodyFont !== undefined && { bodyFont: prev.bodyFont }),
          ...(prev.footerName !== undefined && { footerName: prev.footerName }),
          ...(prev.footerTitle !== undefined && { footerTitle: prev.footerTitle }),
          ...(prev.footerShowYear !== undefined && { footerShowYear: prev.footerShowYear }),
          ...(prev.headerUppercase !== undefined && { headerUppercase: prev.headerUppercase }),
          ...(prev.headerLetterSpacing !== undefined && { headerLetterSpacing: prev.headerLetterSpacing }),
          ...(prev.slidePadding !== undefined && { slidePadding: prev.slidePadding }),
          ...(prev.slideRounding !== undefined && { slideRounding: prev.slideRounding }),
          ...(prev.textureImage !== undefined && { textureImage: prev.textureImage }),
          ...(prev.textureBlendMode !== undefined && { textureBlendMode: prev.textureBlendMode }),
          ...(prev.textureOpacity !== undefined && { textureOpacity: prev.textureOpacity }),
          ...(prev.backgroundLibrary !== undefined && { backgroundLibrary: prev.backgroundLibrary }),
          ...(prev.imageTransforms !== undefined && { imageTransforms: prev.imageTransforms }),
          _history: state._history.slice(0, -1),
          _future: [...state._future, currentSnapshot],
        })
      },

      redo: () => {
        const state = get()
        if (state._future.length === 0) return
        const next = state._future[state._future.length - 1]
        const currentSnapshot: HistorySnapshot = {
          slides: JSON.parse(JSON.stringify(state.slides)),
          selectedSlideId: state.selectedSlideId,
          colorPaletteId: state.colorPaletteId,
          headerFont: state.headerFont,
          bodyFont: state.bodyFont,
          footerName: state.footerName,
          footerTitle: state.footerTitle,
          footerShowYear: state.footerShowYear,
          headerUppercase: state.headerUppercase,
          headerLetterSpacing: state.headerLetterSpacing,
          slidePadding: state.slidePadding,
          slideRounding: state.slideRounding,
          textureImage: state.textureImage,
          textureBlendMode: state.textureBlendMode,
          textureOpacity: state.textureOpacity,
          backgroundLibrary: [...state.backgroundLibrary],
          imageTransforms: JSON.parse(JSON.stringify(state.imageTransforms)),
        }
        set({
          slides: next.slides,
          selectedSlideId: next.selectedSlideId,
          ...(next.colorPaletteId !== undefined && { colorPaletteId: next.colorPaletteId }),
          ...(next.headerFont !== undefined && { headerFont: next.headerFont }),
          ...(next.bodyFont !== undefined && { bodyFont: next.bodyFont }),
          ...(next.footerName !== undefined && { footerName: next.footerName }),
          ...(next.footerTitle !== undefined && { footerTitle: next.footerTitle }),
          ...(next.footerShowYear !== undefined && { footerShowYear: next.footerShowYear }),
          ...(next.headerUppercase !== undefined && { headerUppercase: next.headerUppercase }),
          ...(next.headerLetterSpacing !== undefined && { headerLetterSpacing: next.headerLetterSpacing }),
          ...(next.slidePadding !== undefined && { slidePadding: next.slidePadding }),
          ...(next.slideRounding !== undefined && { slideRounding: next.slideRounding }),
          ...(next.textureImage !== undefined && { textureImage: next.textureImage }),
          ...(next.textureBlendMode !== undefined && { textureBlendMode: next.textureBlendMode }),
          ...(next.textureOpacity !== undefined && { textureOpacity: next.textureOpacity }),
          ...(next.backgroundLibrary !== undefined && { backgroundLibrary: next.backgroundLibrary }),
          ...(next.imageTransforms !== undefined && { imageTransforms: next.imageTransforms }),
          _future: state._future.slice(0, -1),
          _history: [...state._history, currentSnapshot],
        })
      },

      canUndo: () => get()._history.length > 0,
      canRedo: () => get()._future.length > 0,

      addSlide: (type, options) => {
        get()._pushHistory()
        let content = getDefaultContent(type, options?.layoutVariant)

        // Auto-populate work-history from existing CV slides
        if (type === 'work-history') {
          const cvSlides = get().slides.filter((s) => s.type === 'cv')
          if (cvSlides.length > 0) {
            const entries = cvSlides.map((s) => {
              const c = s.content as CVContent
              return {
                company: c.company,
                role: c.roleBadge,
                dateRange: c.dateRange || '',
              }
            })
            content = { ...content, entries } as any
          }
        }

        const slide: Slide = {
          id: nanoid(),
          type,
          content,
          styleVariant: 0,
          darkMode: false,
          drawingLayers: [],
          drawingGroups: [],
        }
        set((state) => {
          const currentIndex = state.selectedSlideId
            ? state.slides.findIndex((s) => s.id === state.selectedSlideId)
            : -1
          const slides = [...state.slides]
          const insertAt = currentIndex === -1 ? slides.length : currentIndex + 1
          slides.splice(insertAt, 0, slide)
          return { slides, selectedSlideId: slide.id }
        })
      },

      removeSlide: (id) => {
        get()._pushHistory()
        set((state) => {
          const idx = state.slides.findIndex((s) => s.id === id)
          const slides = state.slides.filter((s) => s.id !== id)
          // Select adjacent slide: prefer the one above, fall back to below
          const selectedSlideId =
            state.selectedSlideId === id
              ? (slides[Math.max(0, idx - 1)]?.id ?? null)
              : state.selectedSlideId
          return { slides, selectedSlideId }
        })
      },

      duplicateSlide: (id) => {
        get()._pushHistory()
        const state = get()
        const index = state.slides.findIndex((s) => s.id === id)
        if (index === -1) return
        const original = state.slides[index]
        const dupe: Slide = {
          id: nanoid(),
          type: original.type,
          content: JSON.parse(JSON.stringify(original.content)),
          styleVariant: original.styleVariant ?? 0,
          darkMode: original.darkMode ?? false,
          drawingLayers: JSON.parse(JSON.stringify(original.drawingLayers ?? [])),
          drawingGroups: JSON.parse(JSON.stringify(original.drawingGroups ?? [])),
        }
        const slides = [...state.slides]
        slides.splice(index + 1, 0, dupe)
        set({ slides, selectedSlideId: dupe.id })
      },

      reorderSlides: (activeId, overId) => {
        get()._pushHistory()
        set((state) => {
          const oldIndex = state.slides.findIndex((s) => s.id === activeId)
          const newIndex = state.slides.findIndex((s) => s.id === overId)
          if (oldIndex === -1 || newIndex === -1) return state
          const slides = [...state.slides]
          const [moved] = slides.splice(oldIndex, 1)
          slides.splice(newIndex, 0, moved)
          return { slides }
        })
      },

      selectSlide: (id) => set({ selectedSlideId: id }),

      updateSlideContent: (id, content) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, content: { ...s.content, ...content } as SlideContent } : s
          ),
        }))
      },

      resetSlideContent: (id) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== id) return s
            const layoutVariant = s.type === 'bento' ? (s.content as BentoContent).layoutVariant : undefined
            return { ...s, content: getDefaultContent(s.type, layoutVariant) }
          }),
        }))
      },

      setSlideStyleVariant: (id, variant) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, styleVariant: variant } : s
          ),
        }))
      },

      toggleSlideDarkMode: (id) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, darkMode: !s.darkMode } : s
          ),
        }))
      },

      setSlideHeadingSizeStep: (id, step) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, headingSizeStep: step } : s
          ),
        }))
      },

      setSlideBodSizeStep: (id, step) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, bodySizeStep: step } : s
          ),
        }))
      },

      imageTransforms: {},
      setImageTransform: (key, transform) =>
        set((state) => ({
          imageTransforms: { ...state.imageTransforms, [key]: transform },
        })),

      isFullscreen: false,
      toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),

      addSlideSheetOpen: false,
      setAddSlideSheetOpen: (open) => set({ addSlideSheetOpen: open }),

      // Draw mode
      appMode: 'design' as const,
      setAppMode: (mode) => set({ appMode: mode }),
      selectedDrawingLayerIds: [] as string[],
      selectDrawingLayer: (id) => set({ selectedDrawingLayerIds: id ? [id] : [] }),
      toggleDrawingLayerSelection: (id) => set((state) => {
        const ids = state.selectedDrawingLayerIds
        return { selectedDrawingLayerIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] }
      }),
      drawTool: 'pen' as const,
      drawStrokeWidth: 12,
      drawStrokeColor: 'accent',
      setDrawTool: (tool) => set({ drawTool: tool }),
      setDrawStrokeWidth: (w) => set({ drawStrokeWidth: w }),
      setDrawStrokeColor: (c) => set({ drawStrokeColor: c }),
      drawShapeType: 'circle',
      drawShapeFilled: true,
      setDrawShapeType: (shape) => set({ drawShapeType: shape }),
      setDrawShapeFilled: (filled) => set({ drawShapeFilled: filled }),
      drawShapePickerOpen: false,
      setDrawShapePickerOpen: (open) => set({ drawShapePickerOpen: open }),

      addDrawingLayer: (slideId) => {
        const layerId = nanoid()
        const layerCount = get().slides.find((s) => s.id === slideId)?.drawingLayers?.length ?? 0
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            const layers = [...(s.drawingLayers ?? [])]
            layers.push({
              id: layerId,
              paths: [],
              visible: true,
              name: `Layer ${layerCount + 1}`,
              rotation: 0,
              scale: 1,
              offsetX: 0,
              offsetY: 0,
            })
            return { ...s, drawingLayers: layers }
          }),
          selectedDrawingLayerIds: [layerId],
        }))
      },

      removeDrawingLayer: (slideId, layerId) => {
        get()._pushHistory()
        const slide = get().slides.find((s) => s.id === slideId)
        const layers = slide?.drawingLayers ?? []
        const idx = layers.findIndex((l) => l.id === layerId)
        let nextId: string | null = null
        if (layers.length > 1 && idx !== -1) {
          if (idx < layers.length - 1) nextId = layers[idx + 1].id
          else if (idx > 0) nextId = layers[idx - 1].id
        }
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return { ...s, drawingLayers: (s.drawingLayers ?? []).filter((l) => l.id !== layerId) }
          }),
          selectedDrawingLayerIds: state.selectedDrawingLayerIds.includes(layerId)
            ? (nextId ? [nextId] : [])
            : state.selectedDrawingLayerIds,
        }))
      },

      toggleDrawingLayerVisibility: (slideId, layerId) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? { ...l, visible: !l.visible } : l
              ),
            }
          }),
        }))
      },

      addPathToLayer: (slideId, layerId, path) => {
        // History is pushed at pointerDown (drag start), not per-path
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? { ...l, paths: [...l.paths, path] } : l
              ),
            }
          }),
        }))
      },

      removePathFromLayer: (slideId, layerId, pathIndex) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? { ...l, paths: l.paths.filter((_, i) => i !== pathIndex) } : l
              ),
            }
          }),
        }))
      },

      updateDrawingLayerTransform: (slideId, layerId, rotation, scale, scaleX?, scaleY?) => {
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? {
                  ...l, rotation, scale,
                  ...(scaleX !== undefined ? { scaleX } : {}),
                  ...(scaleY !== undefined ? { scaleY } : {}),
                } : l
              ),
            }
          }),
        }))
      },

      setDrawingLayerOpacity: (slideId, layerId, opacity) => {
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? { ...l, opacity } : l
              ),
            }
          }),
        }))
      },

      moveDrawingLayer: (slideId, layerId, offsetX, offsetY) => {
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? { ...l, offsetX, offsetY } : l
              ),
            }
          }),
        }))
      },

      recolorDrawingLayer: (slideId, layerId, color) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? { ...l, paths: l.paths.map((p) => ({ ...p, stroke: color })) } : l
              ),
            }
          }),
        }))
      },

      restrokeDrawingLayer: (slideId, layerId, width) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? { ...l, paths: l.paths.map((p) => ({ ...p, strokeWidth: width })) } : l
              ),
            }
          }),
        }))
      },

      renameDrawingLayer: (slideId, layerId, name) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.id === layerId ? { ...l, name } : l
              ),
            }
          }),
        }))
      },

      duplicateDrawingLayer: (slideId, layerId, inPlace) => {
        get()._pushHistory()
        const slide = get().slides.find((s) => s.id === slideId)
        const layer = (slide?.drawingLayers ?? []).find((l) => l.id === layerId)
        if (!layer) return
        const newId = nanoid()
        const dupe: DrawingLayer = {
          ...JSON.parse(JSON.stringify(layer)),
          id: newId,
          name: `${layer.name} copy`,
          offsetX: (layer.offsetX ?? 0) + (inPlace ? 0 : 40),
          offsetY: (layer.offsetY ?? 0) + (inPlace ? 0 : 40),
        }
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            const layers = [...(s.drawingLayers ?? [])]
            const idx = layers.findIndex((l) => l.id === layerId)
            if (idx === -1) return { ...s, drawingLayers: [...layers, dupe] }
            layers.splice(idx + 1, 0, dupe)
            return { ...s, drawingLayers: layers }
          }),
          selectedDrawingLayerIds: [newId],
        }))
      },

      reorderDrawingLayers: (slideId, fromIndex, toIndex, targetGroupId) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            const layers = [...(s.drawingLayers ?? [])]
            if (fromIndex < 0 || fromIndex >= layers.length) return s
            let [moved] = layers.splice(fromIndex, 1)
            // Update the moved layer's group membership when specified
            if (targetGroupId !== undefined) {
              moved = { ...moved, groupId: targetGroupId ?? undefined }
            }
            layers.splice(Math.max(0, Math.min(toIndex, layers.length)), 0, moved)
            return { ...s, drawingLayers: layers }
          }),
        }))
      },

      removeSelectedDrawingLayers: (slideId) => {
        get()._pushHistory()
        const selected = get().selectedDrawingLayerIds
        if (selected.length === 0) return
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            const remaining = (s.drawingLayers ?? []).filter((l) => !selected.includes(l.id))
            return {
              ...s,
              drawingLayers: remaining,
              drawingGroups: (s.drawingGroups ?? []).filter((g) =>
                remaining.some((l) => l.groupId === g.id)
              ),
            }
          }),
          selectedDrawingLayerIds: [],
        }))
      },

      groupDrawingLayers: (slideId) => {
        const selected = get().selectedDrawingLayerIds
        if (selected.length < 2) return
        get()._pushHistory()
        const groupId = nanoid()
        const slide = get().slides.find((s) => s.id === slideId)
        const layers = slide?.drawingLayers ?? []
        // Use the first selected layer's name as base
        const firstName = layers.find((l) => selected.includes(l.id))?.name ?? 'Group'
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                selected.includes(l.id) ? { ...l, groupId } : l
              ),
              drawingGroups: [...(s.drawingGroups ?? []), { id: groupId, name: `Group`, visible: true }],
            }
          }),
        }))
      },

      ungroupDrawingLayers: (slideId) => {
        const selected = get().selectedDrawingLayerIds
        if (selected.length === 0) return
        get()._pushHistory()
        const slide = get().slides.find((s) => s.id === slideId)
        const layers = slide?.drawingLayers ?? []
        // Find all group IDs that any selected layer belongs to
        const groupIds = new Set<string>()
        for (const id of selected) {
          const layer = layers.find((l) => l.id === id)
          if (layer?.groupId) groupIds.add(layer.groupId)
        }
        if (groupIds.size === 0) return
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.groupId && groupIds.has(l.groupId) ? { ...l, groupId: undefined } : l
              ),
              drawingGroups: (s.drawingGroups ?? []).filter((g) => !groupIds.has(g.id)),
            }
          }),
        }))
      },

      selectGroup: (slideId, groupId) => {
        const slide = get().slides.find((s) => s.id === slideId)
        const layerIds = (slide?.drawingLayers ?? []).filter((l) => l.groupId === groupId).map((l) => l.id)
        set({ selectedDrawingLayerIds: layerIds })
      },

      renameGroup: (slideId, groupId, name) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingGroups: (s.drawingGroups ?? []).map((g) =>
                g.id === groupId ? { ...g, name } : g
              ),
            }
          }),
        }))
      },

      removeGroup: (slideId, groupId) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).filter((l) => l.groupId !== groupId),
              drawingGroups: (s.drawingGroups ?? []).filter((g) => g.id !== groupId),
            }
          }),
          selectedDrawingLayerIds: state.selectedDrawingLayerIds.filter((id) => {
            const layer = state.slides.find((s) => s.id === slideId)?.drawingLayers?.find((l) => l.id === id)
            return layer?.groupId !== groupId
          }),
        }))
      },

      duplicateGroup: (slideId, groupId) => {
        get()._pushHistory()
        const slide = get().slides.find((s) => s.id === slideId)
        if (!slide) return
        const newGroupId = nanoid()
        const groupLayers = (slide.drawingLayers ?? []).filter((l) => l.groupId === groupId)
        const group = (slide.drawingGroups ?? []).find((g) => g.id === groupId)
        if (!group || groupLayers.length === 0) return
        const newLayers: DrawingLayer[] = groupLayers.map((l) => ({
          ...JSON.parse(JSON.stringify(l)),
          id: nanoid(),
          groupId: newGroupId,
          offsetX: (l.offsetX ?? 0) + 40,
          offsetY: (l.offsetY ?? 0) + 40,
        }))
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: [...(s.drawingLayers ?? []), ...newLayers],
              drawingGroups: [...(s.drawingGroups ?? []), { ...group, id: newGroupId, name: `${group.name} copy` }],
            }
          }),
          selectedDrawingLayerIds: newLayers.map((l) => l.id),
        }))
      },

      moveGroup: (slideId, groupId, dx, dy) => {
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              drawingLayers: (s.drawingLayers ?? []).map((l) =>
                l.groupId === groupId
                  ? { ...l, offsetX: (l.offsetX ?? 0) + dx, offsetY: (l.offsetY ?? 0) + dy }
                  : l
              ),
            }
          }),
        }))
      },

      reorderGroup: (slideId, groupId, direction) => {
        get()._pushHistory()
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== slideId) return s
            const layers = [...(s.drawingLayers ?? [])]
            const groupIndices = layers.map((l, i) => l.groupId === groupId ? i : -1).filter((i) => i !== -1)
            if (groupIndices.length === 0) return s

            if (direction === 'up') {
              // Move group layers up (towards end of array = higher in render)
              const lastIdx = groupIndices[groupIndices.length - 1]
              if (lastIdx >= layers.length - 1) return s
              // Move the element after the group to before it
              const [after] = layers.splice(lastIdx + 1, 1)
              layers.splice(groupIndices[0], 0, after)
            } else {
              // Move group layers down
              const firstIdx = groupIndices[0]
              if (firstIdx <= 0) return s
              const [before] = layers.splice(firstIdx - 1, 1)
              layers.splice(groupIndices[groupIndices.length - 1], 0, before)
            }
            return { ...s, drawingLayers: layers }
          }),
        }))
      },

      saveToFile: async () => {
        const state = get()
        // Save the same fields that persist to IDB
        const data = {
          state: {
            slides: state.slides,
            selectedSlideId: state.selectedSlideId,
            colorPaletteId: state.colorPaletteId,
            headerFont: state.headerFont,
            bodyFont: state.bodyFont,
            footerName: state.footerName,
            footerTitle: state.footerTitle,
            footerShowYear: state.footerShowYear,
            headerUppercase: state.headerUppercase,
            headerLetterSpacing: state.headerLetterSpacing,
            slidePadding: state.slidePadding,
            slideRounding: state.slideRounding,
            backgroundLibrary: state.backgroundLibrary,
            textureImage: state.textureImage,
            textureBlendMode: state.textureBlendMode,
            textureOpacity: state.textureOpacity,
            imageTransforms: state.imageTransforms,
          },
        }
        return saveToRepo(data)
      },

      setColorPalette: (id) => { get()._pushHistory(); set({ colorPaletteId: id }) },
      setHeaderFont: (font) => { get()._pushHistory(); set({ headerFont: font }) },
      setBodyFont: (font) => { get()._pushHistory(); set({ bodyFont: font }) },
      setFooterName: (name) => { get()._pushHistory(); set({ footerName: name }) },
      setFooterTitle: (title) => { get()._pushHistory(); set({ footerTitle: title }) },
      setFooterShowYear: (show) => { get()._pushHistory(); set({ footerShowYear: show }) },
      setHeaderUppercase: (v) => { get()._pushHistory(); set({ headerUppercase: v }) },
      setHeaderLetterSpacing: (v) => { get()._pushHistory(); set({ headerLetterSpacing: Math.max(-0.1, Math.min(0.1, v)) }) },
      setSlidePadding: (v) => { get()._pushHistory(); set({ slidePadding: v }) },
      setSlideRounding: (v) => { get()._pushHistory(); set({ slideRounding: v }) },
      addBackgroundToLibrary: (url) => {
        get()._pushHistory()
        const lib = get().backgroundLibrary
        if (!lib.includes(url)) set({ backgroundLibrary: [...lib, url] })
      },
      removeBackgroundFromLibrary: (url) => {
        get()._pushHistory()
        set({ backgroundLibrary: get().backgroundLibrary.filter((u) => u !== url) })
      },
    }),
    {
      name: 'portfolio-builder',
      storage: {
        getItem: async (name) => {
          const str = await idbStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: async (name, value) => {
          await idbStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: async (name) => {
          await idbStorage.removeItem(name)
        },
      },
      partialize: (state) => ({
        slides: state.slides,
        selectedSlideId: state.selectedSlideId,
        colorPaletteId: state.colorPaletteId,
        headerFont: state.headerFont,
        bodyFont: state.bodyFont,
        footerName: state.footerName,
        footerTitle: state.footerTitle,
        footerShowYear: state.footerShowYear,
        headerUppercase: state.headerUppercase,
        headerLetterSpacing: state.headerLetterSpacing,
        slidePadding: state.slidePadding,
        slideRounding: state.slideRounding,
        backgroundLibrary: state.backgroundLibrary,
        textureImage: state.textureImage,
        textureBlendMode: state.textureBlendMode,
        textureOpacity: state.textureOpacity,
        imageTransforms: state.imageTransforms,
        appMode: state.appMode,
      }),
    }
  )
)

// Expose store on window in dev mode for debugging / preview seeding
if (import.meta.env.DEV) {
  ;(window as any).__portfolioStore = usePortfolioStore
}

// ── Seed from repo: if IDB has no data, load from portfolio-data.json ──
// Check IDB directly (bypassing Zustand) to know if this is a truly fresh session.
async function _trySeedFromFile() {
  // Check if IDB has any stored data at all
  const existing = await idbStorage.getItem('portfolio-builder')
  if (existing) return // IDB has data — no seed needed

  const seed = await loadSeedData()
  if (seed && Array.isArray((seed as any).slides) && (seed as any).slides.length > 0) {
    usePortfolioStore.setState(seed)
  }
}

// Run after a short delay to let IDB initialize
setTimeout(_trySeedFromFile, 300)

// ── Bento migration: old flat layoutVariant (0–6) → new image-count model ──
// Old system: layoutVariant was an index into a flat 7-item array (0–6)
// New system: layoutVariant = image count (1–4), styleVariant = sub-layout (A–D)
// Detection: in new system, items.length === layoutVariant. If they don't match, it's old.
const OLD_BENTO_MIGRATION: Record<number, { layoutVariant: number; styleVariant: number }> = {
  0: { layoutVariant: 3, styleVariant: 1 }, // large left + 2R (3 items) → Bento 3b
  1: { layoutVariant: 3, styleVariant: 0 }, // 3 equal cols (3 items) → Bento 3a
  2: { layoutVariant: 3, styleVariant: 2 }, // hero top + 2 below (3 items) → Bento 3c
  3: { layoutVariant: 4, styleVariant: 0 }, // 2×2 grid (4 items) → Bento 4a
  4: { layoutVariant: 3, styleVariant: 1 }, // tall left + 2R (3 items) → Bento 3b
  5: { layoutVariant: 4, styleVariant: 1 }, // asymmetric 2×2 (4 items) → Bento 4b
  6: { layoutVariant: 2, styleVariant: 0 }, // 2 col (2 items) → Bento 2a
}

let _bentoMigrationRan = false
const unsub = usePortfolioStore.subscribe((state) => {
  if (_bentoMigrationRan) return
  if (state.slides.length === 0) return // not yet rehydrated

  _bentoMigrationRan = true
  unsub()

  // Detect old bento slides: items.length !== layoutVariant means old system
  const needsMigration = state.slides.some((s) => {
    if (s.type !== 'bento') return false
    const bc = s.content as BentoContent
    return bc.items.length !== bc.layoutVariant
  })
  if (!needsMigration) return

  const migrated = state.slides.map((s) => {
    if (s.type !== 'bento') return s
    const bc = s.content as BentoContent
    // Already migrated: items.length matches layoutVariant
    if (bc.items.length === bc.layoutVariant) return s
    const m = OLD_BENTO_MIGRATION[bc.layoutVariant]
    if (!m) {
      // Unknown old variant — just set layoutVariant to item count
      return { ...s, content: { ...bc, layoutVariant: bc.items.length } }
    }
    return {
      ...s,
      styleVariant: m.styleVariant,
      content: { ...bc, layoutVariant: m.layoutVariant },
    }
  })

  usePortfolioStore.setState({ slides: migrated })
})
