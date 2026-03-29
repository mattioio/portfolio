/**
 * SmoothCursor — reusable cursor-tracking utility.
 *
 * Handles:
 *  • Frame-rate-independent exponential smoothing (speed configurable)
 *  • show() / hide() with immediate position snap
 *  • Touch-input detection (auto-hides, restores on mouse)
 *  • CSS class toggles (`.visible`, `cursor-active` on container)
 *
 * Each callsite only provides the element refs + optional mode callbacks
 * (arrow morphing, eye mode, etc.) — no animation boilerplate.
 */

export interface SmoothCursorOptions {
  /** The cursor DOM element (gets `.visible` toggled) */
  el: HTMLElement;
  /** The container that receives `.cursor-active` to hide the system cursor */
  container: HTMLElement;
  /** Smoothing speed — higher = snappier. Default 14 */
  speed?: number;
  /** Extra CSS classes to clear on hide (e.g. 'arrow-left', 'arrow-right') */
  extraClasses?: string[];
}

export interface SmoothCursor {
  /** Show cursor, snapping immediately to (x, y) */
  show(x: number, y: number): void;
  /** Hide cursor and stop animation */
  hide(): void;
  /** Update the target position (cursor will trail toward it) */
  moveTo(x: number, y: number): void;
  /** Whether the cursor is currently visible */
  readonly visible: boolean;
  /** Destroy — removes touch listener */
  destroy(): void;
}

export function createSmoothCursor(opts: SmoothCursorOptions): SmoothCursor {
  const { el, container, speed = 14, extraClasses = [] } = opts;

  let cx = 0, cy = 0;   // current (smoothed) position
  let tx = 0, ty = 0;   // target position
  let vis = false;
  let raf = 0;
  let lastTime = 0;

  // ── Animation loop ──
  function tick(now: number) {
    if (!lastTime) lastTime = now;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    const factor = 1 - Math.exp(-speed * dt);
    cx += (tx - cx) * factor;
    cy += (ty - cy) * factor;
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    if (vis) raf = requestAnimationFrame(tick);
  }

  // ── Public API ──
  function show(x: number, y: number) {
    cx = x; cy = y;
    tx = x; ty = y;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    vis = true;
    lastTime = 0;
    el.classList.add('visible');
    container.classList.add('cursor-active');
    requestAnimationFrame(tick);
  }

  function hide() {
    vis = false;
    el.classList.remove('visible', ...extraClasses);
    container.classList.remove('cursor-active');
    cancelAnimationFrame(raf);
  }

  function moveTo(x: number, y: number) {
    tx = x;
    ty = y;
  }

  // ── Touch detection — auto-hide on touch devices ──
  function onTouch() { if (vis) hide(); }
  window.addEventListener('touchstart', onTouch, { passive: true });

  function destroy() {
    hide();
    window.removeEventListener('touchstart', onTouch);
  }

  return {
    show,
    hide,
    moveTo,
    get visible() { return vis; },
    destroy,
  };
}
