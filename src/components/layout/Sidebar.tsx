import { memo, useState, useEffect, useRef, useLayoutEffect } from 'react'
import { SlidesPanel } from './SlidesPanel'
import { ThemePanel } from './ThemePanel'
import { PagePanel } from './PagePanel'
import { AddSlideSheet } from './AddSlideSheet'
import { usePortfolioStore } from '../../store/portfolio-store'
import { Layers, SlidersHorizontal, Settings, Plus } from 'lucide-react'

type Tab = 'slides' | 'page' | 'theme'

function getPersistedTab(): Tab {
  const saved = sessionStorage.getItem('sidebar-tab')
  if (saved === 'slides' || saved === 'page' || saved === 'theme') return saved
  return 'slides'
}

export const Sidebar = memo(function Sidebar() {
  const [tab, setTabState] = useState<Tab>(getPersistedTab)
  const setTab = (t: Tab) => {
    setTabState(t)
    sessionStorage.setItem('sidebar-tab', t)
  }
  const sheetOpen = usePortfolioStore((s) => s.addSlideSheetOpen)
  const setSheetOpen = usePortfolioStore((s) => s.setAddSlideSheetOpen)

  // Sliding indicator
  const tabBarRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ slides: null, page: null, theme: null })
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const btn = tabRefs.current[tab]
    if (btn && tabBarRef.current) {
      const barRect = tabBarRef.current.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      setIndicator({
        left: btnRect.left - barRect.left,
        width: btnRect.width,
      })
    }
  }, [tab])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'q') setTab('slides')
      else if (e.key === 'w') setTab('page')
      else if (e.key === 'e') setTab('theme')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const tabs: { id: Tab; label: string; icon: typeof Layers }[] = [
    { id: 'slides', label: 'Slides', icon: Layers },
    { id: 'page', label: 'Page', icon: SlidersHorizontal },
    { id: 'theme', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="no-print relative flex h-full w-64 flex-shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Tab toggle with sliding indicator */}
      <div ref={tabBarRef} className="relative flex border-b border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[t.id] = el }}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'text-zinc-200'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
        {/* Sliding underline */}
        <div
          className="absolute bottom-0 h-0.5 rounded-full bg-blue-500 transition-all duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      {/* Tab content — all panels stay mounted, use visibility to avoid layout thrash */}
      <div className="relative min-h-0 flex-1">
        {(['slides', 'page', 'theme'] as const).map((id) => (
          <div
            key={id}
            className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden"
            style={{
              ...(tab === id
                ? { visibility: 'visible' as const, zIndex: 1 }
                : { visibility: 'hidden' as const, zIndex: 0, pointerEvents: 'none' as const }),
              // Reserve space for the Add Slide button on the slides tab
              paddingBottom: id === 'slides' ? '3.5rem' : undefined,
            }}
          >
            {id === 'slides' && <SlidesPanel />}
            {id === 'page' && <PagePanel />}
            {id === 'theme' && <ThemePanel />}
          </div>
        ))}
      </div>

      {/* Footer add button — only on the Slides tab */}
      {tab === 'slides' && (
        <button
          onClick={() => setSheetOpen(true)}
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-2 border-t border-zinc-800 bg-zinc-950 py-3 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <Plus size={14} />
          Add Slide
        </button>
      )}

      <AddSlideSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </aside>
  )
})
