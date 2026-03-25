import { useEffect } from 'react'
import { TopNav } from './components/layout/TopNav'
import { Sidebar } from './components/layout/Sidebar'
import { Canvas } from './components/layout/Canvas'
import { LayerPanel } from './components/draw/LayerPanel'
import { DrawToolbar } from './components/draw/DrawToolbar'
import { usePortfolioStore } from './store/portfolio-store'
import { applyPalette } from './themes'
import { idbStorage } from './store/idb-storage'

// One-time migration: move data from localStorage to IndexedDB
;(async () => {
  const key = 'portfolio-builder'
  const lsData = localStorage.getItem(key)
  if (lsData) {
    await idbStorage.setItem(key, lsData)
    localStorage.removeItem(key)
  }
})()

function App() {
  const colorPaletteId = usePortfolioStore((s) => s.colorPaletteId)
  const headerFont = usePortfolioStore((s) => s.headerFont)
  const bodyFont = usePortfolioStore((s) => s.bodyFont)
  const slideRounding = usePortfolioStore((s) => s.slideRounding)
  const slidePadding = usePortfolioStore((s) => s.slidePadding)
  const headerUppercase = usePortfolioStore((s) => s.headerUppercase)
  const headerLetterSpacing = usePortfolioStore((s) => s.headerLetterSpacing)
  const isFullscreen = usePortfolioStore((s) => s.isFullscreen)
  const appMode = usePortfolioStore((s) => s.appMode)

  useEffect(() => {
    applyPalette(colorPaletteId, headerFont, bodyFont, false, slideRounding, slidePadding, headerUppercase, headerLetterSpacing)
  }, [colorPaletteId, headerFont, bodyFont, slideRounding, slidePadding, headerUppercase, headerLetterSpacing])


  if (isFullscreen) {
    return <div className="flex h-full flex-col"><Canvas /></div>
  }

  const isDesign = appMode === 'design'
  const isDraw = appMode === 'draw'

  return (
    <div className="flex h-full flex-col">
      <TopNav />
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar always mounted, hidden in draw mode */}
        <div
          className="h-full"
          style={{ display: isDesign ? 'flex' : 'none' }}
        >
          <Sidebar />
        </div>

        {/* Layer panel on left side, same position as Sidebar */}
        <div style={{ display: isDraw ? 'flex' : 'none' }} className="h-full">
          <LayerPanel />
        </div>

        <Canvas />

        {/* Draw toolbar (floating) */}
        <div style={{ display: isDraw ? 'contents' : 'none' }}>
          <DrawToolbar />
        </div>
      </div>
    </div>
  )
}

export default App
