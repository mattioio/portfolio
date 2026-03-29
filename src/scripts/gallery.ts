/**
 * Gallery page script — image loading, sticky bar, scroll animation, lightbox.
 * Extracted from [category].astro for maintainability.
 */

document.addEventListener('astro:page-load', () => {
  // ===== Per-image fade-in on load =====
  document.querySelectorAll<HTMLImageElement>('.column__item-img').forEach(img => {
    const show = () => {
      img.classList.add('loaded');
      const wrap = img.closest('.column__item-imgwrap');
      if (wrap) wrap.classList.add('revealed');
    };
    if (img.complete && img.naturalWidth > 0) {
      show();
    } else {
      img.addEventListener('load', show, { once: true });
    }
  });

  // ===== Bottom category bar =====
  const catBar = document.getElementById('cat-bar');
  const galleryHero = document.querySelector('.gallery-hero') as HTMLElement;
  const menuToggle = document.getElementById('cat-menu-toggle');

  if (catBar && galleryHero) {
    const showThreshold = () => galleryHero.offsetHeight + galleryHero.offsetTop;
    let barVisible = false;

    function updateCatBar() {
      const shouldShow = window.scrollY > showThreshold();
      if (shouldShow !== barVisible) {
        barVisible = shouldShow;
        catBar!.classList.toggle('visible', shouldShow);
        // Close menu when bar hides
        if (!shouldShow) {
          catBar!.classList.remove('menu-open');
          menuToggle?.setAttribute('aria-expanded', 'false');
        }
      }
    }

    window.addEventListener('scroll', updateCatBar, { passive: true });
    updateCatBar();
  }

  // Menu toggle
  menuToggle?.addEventListener('click', () => {
    const isOpen = catBar!.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (catBar?.classList.contains('menu-open') && !catBar.contains(e.target as Node)) {
      catBar.classList.remove('menu-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // Back to top — hide when page isn't scrollable
  const backToTop = document.getElementById('back-to-top');
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function updateTopVisibility() {
    if (!backToTop) return;
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 100;
    backToTop.style.visibility = isScrollable ? '' : 'hidden';
  }
  updateTopVisibility();
  window.addEventListener('resize', updateTopVisibility, { passive: true });

  // ===== On-scroll column animation (Codrops style) =====
  const columnEls = Array.from(document.querySelectorAll('.column')) as HTMLElement[];
  const allImgWraps = Array.from(document.querySelectorAll('.column__item-imgwrap')) as HTMLElement[];
  const allImgs = Array.from(document.querySelectorAll('.column__item-img')) as HTMLElement[];

  const columnSpeeds = [-3, 5, -8];

  function updateScrollAnimation() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = scrollY / docHeight;

    columnEls.forEach((col, i) => {
      if (window.innerWidth <= 500) {
        col.style.transform = '';
        return;
      }
      const speed = columnSpeeds[i] || 0;
      const yOffset = scrollFraction * speed;
      col.style.transform = `translateY(${yOffset}%)`;
    });

    allImgWraps.forEach((wrap, i) => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const visibility = (rect.top + rect.height / 2 - vh / 2) / vh;

      const img = allImgs[i];
      if (img) {
        const yShift = visibility * -30;
        img.style.transform = `translateY(${yShift}px)`;
      }
    });
  }

  window.addEventListener('scroll', () => {
    requestAnimationFrame(updateScrollAnimation);
  }, { passive: true });

  updateScrollAnimation();

  // ===== Lightbox =====
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const lbImg = lightbox.querySelector(".lightbox__img:not(.lightbox__img--staging)") as HTMLImageElement;
  const stagingImg = lightbox.querySelector(".lightbox__img--staging") as HTMLImageElement;
  const lbCounter = lightbox.querySelector(".lightbox__counter")!;
  const lbHint = lightbox.querySelector(".lightbox__hint") as HTMLElement | null;
  const toolbar = document.getElementById("lb-toolbar");
  const items = document.querySelectorAll<HTMLElement>(".column__item");
  const sources: string[] = [];
  let currentIndex = 0;
  const lqip: Record<string, string> = (window as any).__lqip || {};

  items.forEach((item) => {
    sources.push(item.dataset.src || "");
  });

  // ── Gesture hint — show once per session on mobile, crossfades with counter ──
  let hintShown = sessionStorage.getItem('lb-hint') === '1';

  function showGestureHint() {
    if (hintShown || !lbHint || window.innerWidth > 600) return;
    hintShown = true;
    sessionStorage.setItem('lb-hint', '1');
    setTimeout(() => {
      lbHint.classList.add('visible');
      lbCounter.classList.add('hint-hidden');
      setTimeout(() => {
        lbHint.classList.remove('visible');
        lbCounter.classList.remove('hint-hidden');
      }, 2500);
    }, 300);
  }

  const navEl = document.querySelector('.nav') as HTMLElement | null;

  function open(index: number) {
    currentIndex = index;
    show();
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (navEl) navEl.style.display = 'none';
    if (catBar) catBar.style.display = 'none';
    showGestureHint();
  }

  function close() {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.classList.remove('cursor-active');
    document.body.style.overflow = "";
    if (navEl) navEl.style.display = '';
    if (catBar) catBar.style.display = '';
    if (lbCursor) lbCursor.classList.remove('visible', 'arrow-left', 'arrow-right');
    resetTransform();
    resetStaging();
  }

  function show() {
    const src = sources[currentIndex];
    // Show LQIP blur placeholder while full image loads
    const placeholder = lqip[src];
    if (placeholder) {
      lbImg.style.backgroundImage = `url(${placeholder})`;
      lbImg.style.backgroundSize = 'cover';
      lbImg.style.backgroundPosition = 'center';
    } else {
      lbImg.style.backgroundImage = '';
    }
    lbImg.src = src;
    lbImg.alt = `Photo ${currentIndex + 1} of ${sources.length}`;
    lbCounter.textContent = `${currentIndex + 1} / ${sources.length}`;
    preloadAdjacent();
  }

  function preloadAdjacent() {
    [currentIndex - 1, currentIndex + 1].forEach((i) => {
      if (i >= 0 && i < sources.length) {
        const img = new Image();
        img.src = sources[i];
      }
    });
  }

  function canGoNext() { return currentIndex < sources.length - 1; }
  function canGoPrev() { return currentIndex > 0; }

  function next() {
    if (!canGoNext()) return;
    currentIndex++;
    scale = 1; panX = 0; panY = 0;
    lbImg.style.transform = '';
    show();
  }

  function prev() {
    if (!canGoPrev()) return;
    currentIndex--;
    scale = 1; panX = 0; panY = 0;
    lbImg.style.transform = '';
    show();
  }

  // Animated slide transition for desktop (arrow keys + click zones)
  // Shared slide animation config
  const SLIDE_DUR = '0.45s';
  const SLIDE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

  function prepareSlideStaging(idx: number, fromLeft: boolean) {
    const w = window.innerWidth;
    stagingImg.src = sources[idx];
    const placeholder = lqip[sources[idx]];
    if (placeholder) {
      stagingImg.style.backgroundImage = `url(${placeholder})`;
      stagingImg.style.backgroundSize = 'cover';
      stagingImg.style.backgroundPosition = 'center';
    }
    stagingImg.style.opacity = '1';
    stagingImg.style.transition = 'none';
    const offset = fromLeft ? -(w + GAP) : (w + GAP);
    stagingImg.style.transform = `translate(calc(-50% + ${offset}px), -50%)`;
    stagingImg.offsetHeight; // force reflow
  }

  function slideToNext() {
    if (!canGoNext() || swipeLocked) return;
    swipeLocked = true;
    const w = window.innerWidth;
    prepareSlideStaging(currentIndex + 1, false);
    lbImg.style.transition = `transform ${SLIDE_DUR} ${SLIDE_EASE}`;
    lbImg.style.transform = `translateX(${-(w + GAP)}px)`;
    stagingImg.style.transition = `transform ${SLIDE_DUR} ${SLIDE_EASE}`;
    stagingImg.style.transform = 'translate(-50%, -50%)';
    setTimeout(() => {
      currentIndex++;
      show();
      lbImg.style.transition = '';
      lbImg.style.transform = '';
      resetStaging();
      swipeLocked = false;
    }, 450);
  }

  function slideToPrev() {
    if (!canGoPrev() || swipeLocked) return;
    swipeLocked = true;
    const w = window.innerWidth;
    prepareSlideStaging(currentIndex - 1, true);
    lbImg.style.transition = `transform ${SLIDE_DUR} ${SLIDE_EASE}`;
    lbImg.style.transform = `translateX(${w + GAP}px)`;
    stagingImg.style.transition = `transform ${SLIDE_DUR} ${SLIDE_EASE}`;
    stagingImg.style.transform = 'translate(-50%, -50%)';
    setTimeout(() => {
      currentIndex--;
      show();
      lbImg.style.transition = '';
      lbImg.style.transform = '';
      resetStaging();
      swipeLocked = false;
    }, 450);
  }

  // Reset staging image to hidden
  function resetStaging() {
    stagingImg.style.opacity = '0';
    stagingImg.style.transform = '';
    stagingImg.style.transition = '';
    stagingImg.style.backgroundImage = '';
    stagingImg.src = '';
  }

  items.forEach((item, i) => {
    item.addEventListener("click", () => open(i));
  });

  lightbox.querySelector(".lightbox__close")!.addEventListener("click", close);
  lightbox.querySelector(".lightbox__prev")!.addEventListener("click", slideToPrev);
  lightbox.querySelector(".lightbox__next")!.addEventListener("click", slideToNext);

  // Desktop click zones
  const zonePrev = lightbox.querySelector('.lightbox__zone--prev');
  const zoneNext = lightbox.querySelector('.lightbox__zone--next');
  zonePrev?.addEventListener("click", slideToPrev);
  zoneNext?.addEventListener("click", slideToNext);

  // Click dark area (not the image or zones) to close
  lightbox.querySelector('.lightbox__image-wrap')!.addEventListener("click", (e) => {
    if ((e.target as Element).classList.contains("lightbox__image-wrap")) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") slideToNext();
    if (e.key === "ArrowLeft") slideToPrev();
  });

  // ===== Touch: pinch-to-zoom, pan, 1:1 swipe nav, swipe-down dismiss =====
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let startDist = 0;
  let startScale = 1;
  let startPanX = 0;
  let startPanY = 0;
  let startMidX = 0;
  let startMidY = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isPinching = false;
  let isPanning = false;
  let swipeDir: 'x' | 'y' | null = null;
  let isDraggingDown = false;
  let isDraggingX = false;
  let swipeLocked = false;
  let stagingDirection: 'left' | 'right' | null = null;

  function resetTransform() {
    scale = 1;
    panX = 0;
    panY = 0;
    lbImg.style.transform = '';
  }

  function applyTransform() {
    lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    lbImg.style.transition = 'none';
  }

  function dist(t1: Touch, t2: Touch) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  const imageWrap = lightbox.querySelector('.lightbox__image-wrap') as HTMLElement;
  const vw = () => window.innerWidth;
  const GAP = 40; // px gap between images during swipe

  // Prepare staging image for a swipe direction (returns false if at edge)
  function prepareStaging(dir: 'left' | 'right'): boolean {
    const nextIdx = dir === 'left' ? currentIndex + 1 : currentIndex - 1;
    if (nextIdx < 0 || nextIdx >= sources.length) {
      stagingDirection = dir;
      return false; // at edge
    }
    stagingImg.src = sources[nextIdx];
    stagingImg.alt = `Photo ${nextIdx + 1} of ${sources.length}`;
    const placeholder = lqip[sources[nextIdx]];
    if (placeholder) {
      stagingImg.style.backgroundImage = `url(${placeholder})`;
      stagingImg.style.backgroundSize = 'cover';
      stagingImg.style.backgroundPosition = 'center';
    }
    stagingImg.style.opacity = '1';
    stagingImg.style.transition = 'none';
    stagingDirection = dir;
    return true;
  }

  // Position staging image based on current drag dx
  function positionStaging(dx: number) {
    if (!stagingDirection) return;
    const offset = stagingDirection === 'left'
      ? vw() + GAP + dx   // starts at +vw, moves left
      : -(vw() + GAP) + dx; // starts at -vw, moves right
    stagingImg.style.transform = `translate(calc(-50% + ${offset}px), -50%)`;
  }

  imageWrap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      isPinching = true;
      startDist = dist(e.touches[0], e.touches[1]);
      startScale = scale;
      startMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      startMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      startPanX = panX;
      startPanY = panY;
      e.preventDefault();
    } else if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      startPanX = panX;
      startPanY = panY;
      isPanning = scale > 1;
      swipeDir = null;
      isDraggingDown = false;
      isDraggingX = false;
      stagingDirection = null;
    }
  }, { passive: false });

  imageWrap.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      const curDist = dist(e.touches[0], e.touches[1]);
      const newScale = Math.max(1, Math.min(5, startScale * (curDist / startDist)));
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      panX = startPanX + (midX - startMidX);
      panY = startPanY + (midY - startMidY);
      scale = newScale;
      applyTransform();
    } else if (e.touches.length === 1 && !isPinching) {
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      if (scale > 1) {
        // Panning while zoomed
        e.preventDefault();
        panX = startPanX + dx;
        panY = startPanY + dy;
        applyTransform();
      } else if (!swipeLocked) {
        // Lock swipe direction once past threshold
        if (!swipeDir && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
          swipeDir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        }

        if (swipeDir === 'x') {
          // ── Horizontal: 1:1 carousel swipe ──
          e.preventDefault();
          isDraggingX = true;

          // Prepare staging image on first move
          const wantDir = dx < 0 ? 'left' : 'right';
          if (!stagingDirection || stagingDirection !== wantDir) {
            resetStaging();
            const hasNext = prepareStaging(wantDir);
            // Track if we're at edge for rubber-band
            (imageWrap as any).__atEdge = !hasNext;
          }

          // Rubber-band at edges: 30% resistance
          const atEdge = (imageWrap as any).__atEdge;
          const effectiveDx = atEdge ? dx * 0.3 : dx;

          // Move current image
          lbImg.style.transition = 'none';
          lbImg.style.transform = `translateX(${effectiveDx}px)`;
          // Move staging image (only if not at edge)
          if (!atEdge) positionStaging(dx);

        } else if (swipeDir === 'y' && dy > 0) {
          // ── Vertical: swipe down to dismiss ──
          e.preventDefault();
          isDraggingDown = true;
          const progress = Math.min(1, dy / (window.innerHeight * 0.4));
          lbImg.style.transition = 'none';
          lbImg.style.transform = `translateY(${dy}px) scale(${1 - progress * 0.08})`;
          lightbox.style.backgroundColor = `rgba(0, 0, 0, ${1 - progress * 0.6})`;
          if (toolbar) {
            toolbar.style.transition = 'none';
            toolbar.style.transform = `translateY(${progress * 100}%)`;
            toolbar.style.opacity = String(1 - progress);
          }
        }
      }
    }
  }, { passive: false });

  imageWrap.addEventListener('touchend', (e) => {
    if (isPinching) {
      isPinching = false;
      if (scale <= 1.1) {
        scale = 1; panX = 0; panY = 0;
        lbImg.style.transition = 'transform 0.2s ease';
        lbImg.style.transform = '';
      }
      swipeDir = null;
      isDraggingDown = false;
      isDraggingX = false;
      resetStaging();
      return;
    }

    if (scale <= 1 && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;
      const velocity = Math.abs(dx) / Math.max(elapsed, 1); // px/ms

      // ── Swipe down dismiss ──
      if (isDraggingDown) {
        isDraggingDown = false;
        swipeDir = null;
        const spring = 'cubic-bezier(0.2, 0.9, 0.3, 1)';
        if (dy > 120) {
          swipeLocked = true;
          document.body.style.overflow = "";
          if (navEl) navEl.style.display = '';
          if (catBar) catBar.style.display = '';
          lbImg.style.transition = `transform 0.35s ${spring}`;
          lbImg.style.transform = `translateY(${window.innerHeight}px) scale(0.85)`;
          lightbox.style.transition = 'opacity 0.3s ease, background-color 0.3s ease';
          lightbox.style.backgroundColor = 'rgba(0, 0, 0, 0)';
          lightbox.style.opacity = '0';
          if (toolbar) {
            toolbar.style.transition = `transform 0.3s ${spring}, opacity 0.3s ease`;
            toolbar.style.transform = 'translateY(100%)';
            toolbar.style.opacity = '0';
          }
          setTimeout(() => {
            lightbox.classList.remove("active");
            lightbox.setAttribute("aria-hidden", "true");
            resetTransform();
            lbImg.style.transition = '';
            lbImg.style.transform = '';
            lightbox.style.transition = '';
            lightbox.style.backgroundColor = '';
            lightbox.style.opacity = '';
            if (toolbar) { toolbar.style.transition = ''; toolbar.style.transform = ''; toolbar.style.opacity = ''; }
            swipeLocked = false;
          }, 350);
        } else {
          const bounce = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
          lbImg.style.transition = `transform 0.4s ${bounce}`;
          lbImg.style.transform = '';
          lightbox.style.transition = 'background-color 0.3s ease';
          lightbox.style.backgroundColor = '';
          if (toolbar) {
            toolbar.style.transition = `transform 0.4s ${bounce}, opacity 0.3s ease`;
            toolbar.style.transform = '';
            toolbar.style.opacity = '';
          }
          setTimeout(() => {
            lbImg.style.transition = '';
            lightbox.style.transition = '';
            if (toolbar) toolbar.style.transition = '';
          }, 400);
        }
        return;
      }

      // ── Horizontal carousel release ──
      if (isDraggingX) {
        isDraggingX = false;
        swipeDir = null;
        const atEdge = (imageWrap as any).__atEdge;
        const threshold = vw() * 0.25;
        const shouldComplete = !atEdge && (Math.abs(dx) > threshold || velocity > 0.5);
        const dur = '0.3s';
        const ease = 'cubic-bezier(0.2, 0.9, 0.3, 1)';
        (imageWrap as any).__atEdge = false;

        if (shouldComplete && Math.abs(dx) > 15) {
          // Complete transition — slide current off, staging in
          const goingLeft = dx < 0;
          const slideOutX = goingLeft ? -vw() - GAP : vw() + GAP;

          lbImg.style.transition = `transform ${dur} ${ease}`;
          lbImg.style.transform = `translateX(${slideOutX}px)`;

          stagingImg.style.transition = `transform ${dur} ${ease}`;
          stagingImg.style.transform = 'translate(-50%, -50%)'; // center

          swipeLocked = true;
          setTimeout(() => {
            if (goingLeft) {
              currentIndex++;
            } else {
              currentIndex--;
            }
            show();
            lbImg.style.transition = '';
            lbImg.style.transform = '';
            resetStaging();
            swipeLocked = false;
          }, 300);
        } else {
          // Snap back (includes edge rubber-band bounce)
          const snapEase = atEdge ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : ease;
          lbImg.style.transition = `transform ${dur} ${snapEase}`;
          lbImg.style.transform = '';

          if (stagingDirection && !atEdge) {
            const returnX = stagingDirection === 'left' ? vw() + GAP : -(vw() + GAP);
            stagingImg.style.transition = `transform ${dur} ${ease}, opacity ${dur} ease`;
            stagingImg.style.transform = `translate(calc(-50% + ${returnX}px), -50%)`;
            stagingImg.style.opacity = '0';
          }

          setTimeout(() => {
            lbImg.style.transition = '';
            resetStaging();
          }, 300);
        }
        return;
      }
    }

    swipeDir = null;
    isDraggingDown = false;
    isDraggingX = false;
  });

  // Double-tap to zoom on mobile
  let lastTap = 0;
  imageWrap.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1 || isPinching || isDraggingX || isDraggingDown) return;
    const now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
      if (scale > 1) {
        scale = 1; panX = 0; panY = 0;
        lbImg.style.transition = 'transform 0.3s ease';
        lbImg.style.transform = '';
      } else {
        const rect = lbImg.getBoundingClientRect();
        const tapX = e.changedTouches[0].clientX;
        const tapY = e.changedTouches[0].clientY;
        const imgCenterX = rect.left + rect.width / 2;
        const imgCenterY = rect.top + rect.height / 2;
        scale = 2.5;
        panX = (imgCenterX - tapX) * 1.5;
        panY = (imgCenterY - tapY) * 1.5;
        lbImg.style.transition = 'transform 0.3s ease';
        lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      }
    }
    lastTap = now;
  });

  // ===== Desktop custom cursor (dot + arrows) =====
  const lbCursor = document.getElementById('lb-cursor');
  if (lbCursor && window.matchMedia('(min-width: 601px)').matches) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    let cursorVis = false;
    let cursorRaf = 0;
    let lastCurTime = 0;
    const edgeZone = 0.2;

    function animateLbCursor(now: number) {
      if (!lastCurTime) lastCurTime = now;
      const dt = (now - lastCurTime) / 1000;
      lastCurTime = now;
      const factor = 1 - Math.exp(-14 * dt);
      cx += (tx - cx) * factor;
      cy += (ty - cy) * factor;
      lbCursor!.style.translate = `${cx}px ${cy}px`;
      if (cursorVis) cursorRaf = requestAnimationFrame(animateLbCursor);
    }

    function updateCursorMode(x: number) {
      const pct = x / window.innerWidth;
      if (pct < edgeZone && canGoPrev()) {
        lbCursor!.classList.add('arrow-left');
        lbCursor!.classList.remove('arrow-right');
      } else if (pct > (1 - edgeZone) && canGoNext()) {
        lbCursor!.classList.remove('arrow-left');
        lbCursor!.classList.add('arrow-right');
      } else {
        lbCursor!.classList.remove('arrow-left', 'arrow-right');
      }
    }

    imageWrap.addEventListener('mouseenter', (e) => {
      // Snap cursor to mouse position immediately on enter (no fly-in from 0,0)
      cx = e.clientX; cy = e.clientY;
      tx = e.clientX; ty = e.clientY;
      lbCursor!.style.translate = `${cx}px ${cy}px`;
      cursorVis = true;
      lastCurTime = 0;
      lbCursor!.classList.add('visible');
      lightbox.classList.add('cursor-active');
      updateCursorMode(e.clientX);
      requestAnimationFrame(animateLbCursor);
    });

    imageWrap.addEventListener('mouseleave', () => {
      cursorVis = false;
      lbCursor!.classList.remove('visible', 'arrow-left', 'arrow-right');
      lightbox.classList.remove('cursor-active');
      cancelAnimationFrame(cursorRaf);
    });

    imageWrap.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      updateCursorMode(e.clientX);
    });

    toolbar?.addEventListener('mouseenter', () => {
      lbCursor!.classList.remove('visible', 'arrow-left', 'arrow-right');
      lightbox.classList.remove('cursor-active');
    });
    toolbar?.addEventListener('mouseleave', () => {
      if (lightbox.classList.contains('active')) {
        lbCursor!.classList.add('visible');
        lightbox.classList.add('cursor-active');
      }
    });
  }

}); // end astro:page-load
