/**
 * Optional full-bleed background image for text-led templates.
 * Sits at z-0 with a surface-coloured scrim so the existing themed text stays
 * legible (and adapts to dark mode, since the scrim uses --color-surface).
 * Render as the FIRST child of a `relative` slide root; wrap the slide's
 * content in a `relative z-10` container so it paints above this.
 */
export function SlideBackdrop({ image, scrim = 0.72 }: { image?: string; scrim?: number }) {
  if (!image) return null
  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'var(--color-surface)', opacity: scrim }} />
    </div>
  )
}
