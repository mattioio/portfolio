import { useRef, useCallback } from 'react'
import { usePortfolioStore } from '../../store/portfolio-store'
import { ALL_HEADER_FONTS, ALL_BODY_FONTS, COLOR_PALETTES } from '../../themes'
import { Palette, Type, User, Maximize, ImageIcon, Plus, X, Layers } from 'lucide-react'

export function ThemePanel() {
  const colorPaletteId = usePortfolioStore((s) => s.colorPaletteId)
  const headerFont = usePortfolioStore((s) => s.headerFont)
  const bodyFont = usePortfolioStore((s) => s.bodyFont)
  const setColorPalette = usePortfolioStore((s) => s.setColorPalette)
  const setHeaderFont = usePortfolioStore((s) => s.setHeaderFont)
  const setBodyFont = usePortfolioStore((s) => s.setBodyFont)
  const headerUppercase = usePortfolioStore((s) => s.headerUppercase)
  const setHeaderUppercase = usePortfolioStore((s) => s.setHeaderUppercase)
  const headerLetterSpacing = usePortfolioStore((s) => s.headerLetterSpacing)
  const setHeaderLetterSpacing = usePortfolioStore((s) => s.setHeaderLetterSpacing)
  const slidePadding = usePortfolioStore((s) => s.slidePadding)
  const slideRounding = usePortfolioStore((s) => s.slideRounding)
  const setSlidePadding = usePortfolioStore((s) => s.setSlidePadding)
  const setSlideRounding = usePortfolioStore((s) => s.setSlideRounding)
  const footerName = usePortfolioStore((s) => s.footerName)
  const footerTitle = usePortfolioStore((s) => s.footerTitle)
  const footerShowYear = usePortfolioStore((s) => s.footerShowYear)
  const setFooterName = usePortfolioStore((s) => s.setFooterName)
  const setFooterTitle = usePortfolioStore((s) => s.setFooterTitle)
  const setFooterShowYear = usePortfolioStore((s) => s.setFooterShowYear)
  const backgroundLibrary = usePortfolioStore((s) => s.backgroundLibrary)
  const addBackgroundToLibrary = usePortfolioStore((s) => s.addBackgroundToLibrary)
  const removeBackgroundFromLibrary = usePortfolioStore((s) => s.removeBackgroundFromLibrary)
  const textureImage = usePortfolioStore((s) => s.textureImage)
  const textureBlendMode = usePortfolioStore((s) => s.textureBlendMode)
  const textureOpacity = usePortfolioStore((s) => s.textureOpacity)
  const setTextureImage = usePortfolioStore((s) => s.setTextureImage)
  const setTextureBlendMode = usePortfolioStore((s) => s.setTextureBlendMode)
  const setTextureOpacity = usePortfolioStore((s) => s.setTextureOpacity)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const textureInputRef = useRef<HTMLInputElement>(null)

  const handleBgFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') addBackgroundToLibrary(reader.result)
      }
      reader.readAsDataURL(file)
    })
  }, [addBackgroundToLibrary])

  return (
    <div className="flex flex-col gap-5 p-3">
      {/* Color palette picker */}
      <div>
        <label className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <Palette size={12} />
          Colour
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_PALETTES.map((p) => {
            const isActive = p.id === colorPaletteId
            return (
              <button
                key={p.id}
                onClick={() => setColorPalette(p.id)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-zinc-800'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex gap-0.5">
                  <div className="h-5 w-5 rounded-l-md" style={{ background: p.light.background }} />
                  <div className="h-5 w-5" style={{ background: p.swatch }} />
                  <div className="h-5 w-5 rounded-r-md" style={{ background: p.light.cardDark }} />
                </div>
                <span className="text-[10px] text-zinc-400">{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Header font */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <Type size={12} />
          Header font
        </label>
        <select
          value={headerFont}
          onChange={(e) => setHeaderFont(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
        >
          {ALL_HEADER_FONTS.map((f) => (
            <option key={f.family} value={f.family}>{f.name}</option>
          ))}
        </select>
        <p className="mt-1.5 text-lg text-zinc-300" style={{ fontFamily: headerFont, textTransform: headerUppercase ? 'uppercase' : undefined, letterSpacing: `${headerLetterSpacing}em` }}>
          The quick brown fox
        </p>
        <div className="mt-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Letter spacing</span>
            <span className="text-xs tabular-nums text-zinc-500">{headerLetterSpacing.toFixed(2)}em</span>
          </div>
          <input
            type="range"
            min={-0.1}
            max={0.1}
            step={0.005}
            value={headerLetterSpacing}
            onChange={(e) => setHeaderLetterSpacing(Number(e.target.value))}
            className="slider-input w-full"
          />
        </div>
        <label className="mt-2 flex items-center justify-between">
          <span className="text-xs text-zinc-400">Uppercase</span>
          <button
            onClick={() => setHeaderUppercase(!headerUppercase)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              headerUppercase ? 'bg-blue-500' : 'bg-zinc-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                headerUppercase ? 'translate-x-4' : ''
              }`}
            />
          </button>
        </label>
      </div>

      {/* Body font */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <Type size={12} />
          Body font
        </label>
        <select
          value={bodyFont}
          onChange={(e) => setBodyFont(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
        >
          {ALL_BODY_FONTS.map((f) => (
            <option key={f.family} value={f.family}>{f.name}</option>
          ))}
        </select>
        <p className="mt-1.5 text-sm text-zinc-300" style={{ fontFamily: bodyFont }}>
          The quick brown fox jumps over the lazy dog.
        </p>
      </div>

      {/* Slide layout */}
      <div>
        <label className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <Maximize size={12} />
          Slide layout
        </label>
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Padding</span>
              <span className="text-xs tabular-nums text-zinc-500">{slidePadding}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={4}
              value={slidePadding}
              onChange={(e) => setSlidePadding(Number(e.target.value))}
              className="slider-input w-full"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Rounding</span>
              <span className="text-xs tabular-nums text-zinc-500">{slideRounding}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={2}
              value={slideRounding}
              onChange={(e) => setSlideRounding(Number(e.target.value))}
              className="slider-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div>
        <label className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <User size={12} />
          Footer
        </label>
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            value={footerName}
            onChange={(e) => setFooterName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
          />
          <input
            type="text"
            value={footerTitle}
            onChange={(e) => setFooterTitle(e.target.value)}
            placeholder="Your title"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
          />
          <label className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Show year</span>
            <button
              onClick={() => setFooterShowYear(!footerShowYear)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                footerShowYear ? 'bg-blue-500' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  footerShowYear ? 'translate-x-4' : ''
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Background library */}
      <div>
        <label className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <ImageIcon size={12} />
          Backgrounds
        </label>
        <div className="flex flex-wrap gap-2">
          {backgroundLibrary.map((url, i) => (
            <div key={i} className="group relative h-16 w-20 overflow-hidden rounded-lg border border-zinc-700">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => removeBackgroundFromLibrary(url)}
                className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-0.5 text-white hover:bg-red-500 group-hover:block"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => bgInputRef.current?.click()}
            className="flex h-16 w-20 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-400"
          >
            <Plus size={16} />
          </button>
        </div>
        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleBgFiles(e.target.files)}
        />
        <p className="mt-2 text-[10px] text-zinc-600">
          Add images here to quick-pick them on any slide's Page tab.
        </p>
      </div>

      {/* Texture overlay */}
      <div>
        <label className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          <Layers size={12} />
          Texture overlay
        </label>

        {textureImage ? (
          <div className="relative">
            <div className="h-24 w-full overflow-hidden rounded-lg border border-zinc-700">
              <img src={textureImage} alt="" className="h-full w-full object-cover" />
            </div>
            <button
              onClick={() => setTextureImage('')}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-red-500"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => textureInputRef.current?.click()}
            className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-zinc-700 text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-400"
          >
            <div className="flex flex-col items-center gap-1.5">
              <Plus size={16} />
              <span className="text-[10px]">Add texture</span>
            </div>
          </button>
        )}

        <input
          ref={textureInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file || !file.type.startsWith('image/')) return
            const reader = new FileReader()
            reader.onload = () => {
              if (typeof reader.result === 'string') setTextureImage(reader.result)
            }
            reader.readAsDataURL(file)
            e.target.value = ''
          }}
        />

        {textureImage && (
          <div className="mt-3 flex flex-col gap-3">
            {/* Blend mode */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Blend mode</span>
              </div>
              <select
                value={textureBlendMode}
                onChange={(e) => setTextureBlendMode(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
              >
                <option value="overlay">Overlay</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="soft-light">Soft Light</option>
                <option value="hard-light">Hard Light</option>
                <option value="color-burn">Colour Burn</option>
                <option value="color-dodge">Colour Dodge</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
                <option value="luminosity">Luminosity</option>
              </select>
            </div>

            {/* Opacity */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Opacity</span>
                <span className="text-xs tabular-nums text-zinc-500">{Math.round(textureOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={textureOpacity * 100}
                onChange={(e) => setTextureOpacity(Number(e.target.value) / 100)}
                className="slider-input w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
