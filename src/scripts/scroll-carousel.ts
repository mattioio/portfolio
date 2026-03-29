/**
 * ScrollCarousel — scroll-driven hero carousel with custom cursor,
 * pagination, keyboard/mouse/touch navigation, and scroll-snap.
 *
 * Extracted from ScrollCarousel.astro for maintainability.
 * Expects the carousel DOM to be present on the page.
 */

// Module-level controller — persists across page navigations.
// Aborted in astro:before-preparation so the old scroll/wheel/etc listeners
// are removed BEFORE Astro manipulates scroll during the transition.
// Without this, the old scroll listener fires during Astro's scroll-reset
// and animates the carousel through every intermediate slide.
let carouselAC: AbortController | null = null;

document.addEventListener('astro:before-preparation', () => {
  carouselAC?.abort();
  carouselAC = null;
});

document.addEventListener('astro:page-load', () => {
  carouselAC = new AbortController();
  const { signal } = carouselAC;

  // ===== CACHED DOM REFS =====
  const hero = document.querySelector('.hero') as HTMLElement;
  if (!hero) return; // Not on homepage — bail
  const slideEls = Array.from(document.querySelectorAll('.hero__slide')) as HTMLElement[];
  const darkenEls = Array.from(document.querySelectorAll('.hero__slide-darken')) as HTMLElement[];
  const pageNums = Array.from(document.querySelectorAll('.hero__page-num')) as HTMLElement[];
  const pageFill = document.querySelector('.hero__page-fill') as HTMLElement;
  const headingMain = document.querySelector('.hero__heading-main') as HTMLElement;
  const headingAccent = document.querySelector('.hero__heading-accent') as HTMLElement;
  const desc = document.querySelector('.hero__desc') as HTMLElement;
  const bottomEl = document.querySelector('.hero__bottom') as HTMLElement;
  const stickyEl = document.querySelector('.hero__sticky') as HTMLElement;
  const dotEl = document.getElementById('hero-dot')!;
  const enterEl = document.getElementById('hero-enter') as HTMLAnchorElement;
  const enterCatEl = document.getElementById('hero-enter-cat');
  const heroTextEl = document.querySelector('.hero__text') as HTMLElement;
  const paginationEl = document.querySelector('.hero__pagination') as HTMLElement;
  const bubbleEl = document.querySelector('.hero__page-bubble') as HTMLElement;

  const slideCount = slideEls.length;

  // Content per slide
  const content = [
    { main: "Music &", accent: "Events", desc: "Live performance, backstage moments, and the raw energy of the stage." },
    { main: "Portrait", accent: "Photography", desc: "Authentic portraits that reveal character and emotion." },
    { main: "Wedding", accent: "Photography", desc: "From intimate ceremonies to grand celebrations — every moment preserved." },
    { main: "Food &", accent: "Hospitality", desc: "Editorial food photography that tells a story on every plate." },
    { main: "Sport", accent: "Photography", desc: "Peak athletic moments and the intensity of competition, frame by frame." },
    { main: "Travel", accent: "Photography", desc: "Landscapes, cultures, and fleeting moments from around the world." },
  ];

  let currentSlide = 0;
  let ticking = false;
  let lastT = 0;
  // When the user clicks a pagination number we jump the bubble straight to the
  // target and lock it there until the scroll settles — prevents the orb
  // hopping through every intermediate number during programmatic navigation.
  let bubbleLockedTo = -1;

  // Track previous state per slide — skip DOM writes when nothing changed
  const prevState = new Array(slideCount).fill('');
  let prevSP = -1;
  let wasFixed = false;
  // Suppresses the text fade animation during the initial snap-to-position
  let isInitialRender = true;

  // ===== CORE ANIMATION — GPU-friendly, no filters =====
  function setSlide(index: number, t: number) {
    const sp = index + t;

    // Early-out: if slideProgress hasn't meaningfully changed, skip everything
    if (Math.abs(sp - prevSP) < 0.0001) return;
    prevSP = sp;

    for (let i = 0; i < slideCount; i++) {
      const delta = sp - i;
      const slide = slideEls[i];
      const darken = darkenEls[i];
      let state: string;

      if (delta >= 1) {
        state = 'passed';
        if (prevState[i] === state) continue; // skip — already hidden
        slide.style.cssText = 'opacity:0;z-index:1;clip-path:inset(0);transform:translate3d(-16%,0,0) scale(1.5)';
        darken.style.opacity = '0';
      } else if (delta >= 0) {
        // Current slide — zoom/drift with darken OVERLAY (not filter!)
        const zoom = 1 + delta * 0.5;
        const drift = -(delta * 16);
        state = `cur${(delta * 1000) | 0}`;
        slide.style.cssText = `opacity:1;z-index:2;clip-path:inset(0);transform:translate3d(${drift}%,0,0) scale(${zoom})`;
        darken.style.opacity = String(delta * 0.6);
      } else if (delta >= -1) {
        // Next slide — peek strip expanding to full screen
        const shrink = -delta; // 1 (peek) → 0 (full)
        const top = (15 * shrink) | 0 ? 15 * shrink : 0;
        const left = (85 * shrink) | 0 ? 85 * shrink : 0;
        const r = 10 * shrink;
        state = `next${(shrink * 1000) | 0}`;
        // Only add round when radius is visible (> 0.5px)
        const clip = r > 0.5
          ? `inset(${top}% 0% ${top}% ${left}% round ${r}px 0 0 ${r}px)`
          : `inset(${top}% 0% ${top}% ${left}%)`;
        slide.style.cssText = `opacity:1;z-index:3;clip-path:${clip};transform:translate3d(0,0,0)`;
        darken.style.opacity = '0';
      } else if (delta >= -1.4) {
        // Two ahead — growing into peek position
        const growT = (delta + 1.4) / 0.4;
        const eased = growT * growT * (3 - 2 * growT);
        const previewLeft = 100 - 15 * eased;
        const previewTop = 50 - 35 * eased;
        const r = 10 * eased;
        state = `peek${(eased * 1000) | 0}`;
        const clip = r > 0.5
          ? `inset(${previewTop}% 0% ${previewTop}% ${previewLeft}% round ${r}px 0 0 ${r}px)`
          : `inset(${previewTop}% 0% ${previewTop}% ${previewLeft}%)`;
        slide.style.cssText = `opacity:${eased};z-index:4;clip-path:${clip};transform:translate3d(0,0,0)`;
        darken.style.opacity = '0';
      } else {
        state = 'hidden';
        if (prevState[i] === state) continue; // skip — already hidden
        slide.style.cssText = 'opacity:0;z-index:1;clip-path:inset(50% 0% 50% 100%);transform:translate3d(0,0,0)';
        darken.style.opacity = '0';
      }

      prevState[i] = state;
    }

    // Update text when dominant slide changes
    const newSlide = Math.min(Math.max(Math.round(sp), 0), slideCount - 1);
    if (newSlide !== currentSlide) {
      currentSlide = newSlide;

      if (isInitialRender) {
        // Snap text instantly — no fade during back-navigation scroll restore
        headingMain.textContent = content[currentSlide].main;
        headingAccent.textContent = content[currentSlide].accent;
        desc.textContent = content[currentSlide].desc;
        headingMain.style.opacity = '1';
        headingMain.style.transform = 'translateY(0)';
        headingAccent.style.opacity = '0.8';
        headingAccent.style.transform = 'translateY(0)';
        desc.style.opacity = '1';
      } else {
        headingMain.style.opacity = '0';
        headingMain.style.transform = 'translateY(20px)';
        headingAccent.style.opacity = '0';
        headingAccent.style.transform = 'translateY(20px)';
        desc.style.opacity = '0';

        setTimeout(() => {
          headingMain.textContent = content[currentSlide].main;
          headingAccent.textContent = content[currentSlide].accent;
          desc.textContent = content[currentSlide].desc;

          requestAnimationFrame(() => {
            headingMain.style.opacity = '1';
            headingMain.style.transform = 'translateY(0)';
            setTimeout(() => {
              headingAccent.style.opacity = '0.8';
              headingAccent.style.transform = 'translateY(0)';
            }, 80);
            desc.style.opacity = '1';
          });
        }, 250);
      }

      pageNums.forEach((num, ni) => num.classList.toggle('active', ni === currentSlide));
      // Only follow naturally — skip if bubble is locked to a click target
      if (bubbleLockedTo === -1) moveBubbleTo(currentSlide);
    }

    lastT = t;
    pageFill.style.height = `${(sp / (slideCount - 1)) * 100}%`;
  }

  // ===== SCROLL HANDLER — single listener, cached values =====
  let stableW = window.innerWidth;
  let carouselHeight = window.innerHeight * 4.5;
  let heroTop = hero.offsetTop;
  let heroHeight = hero.offsetHeight;
  let vh = window.innerHeight;

  window.addEventListener('resize', () => {
    // Ignore height-only changes (Chrome URL bar appearing/disappearing)
    // Only recalculate on actual width changes (orientation, desktop resize)
    if (window.innerWidth === stableW) return;
    stableW = window.innerWidth;
    carouselHeight = window.innerHeight * 4.5;
    heroTop = hero.offsetTop;
    heroHeight = hero.offsetHeight;
    vh = window.innerHeight;
    recalcRects();
  }, { passive: true, signal });

  function update() {
    const scrollY = window.scrollY;
    const scrolled = Math.max(0, scrollY - heroTop);
    const progress = Math.min(1, scrolled / carouselHeight);

    let slideProgress = progress * (slideCount - 1);

    // Snap to exact integers when very close
    const nearest = Math.round(slideProgress);
    if (Math.abs(slideProgress - nearest) < 0.005) {
      slideProgress = nearest;
    }

    const activeSlide = Math.min(Math.floor(slideProgress), slideCount - 2);
    const t = slideProgress - activeSlide;

    setSlide(activeSlide, t);

    // Fade out bottom content in the buffer zone
    const bufferStart = carouselHeight;
    const bufferEnd = bufferStart + vh * 0.5;
    const bufferProgress = (scrolled - bufferStart) / (bufferEnd - bufferStart);

    if (bufferProgress <= 0) {
      bottomEl.style.opacity = '1';
      bottomEl.style.transform = 'translateY(0)';
    } else if (bufferProgress < 1) {
      bottomEl.style.opacity = String(1 - bufferProgress);
      bottomEl.style.transform = `translateY(${bufferProgress * -30}px)`;
    } else {
      bottomEl.style.opacity = '0';
    }

    // Lock hero in place once sticky would release
    const heroEnd = heroHeight - vh;
    const shouldFix = scrolled >= heroEnd - 10 && scrolled > carouselHeight;
    if (shouldFix !== wasFixed) {
      wasFixed = shouldFix;
      if (shouldFix) {
        stickyEl.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:1;height:100vh;height:100svh;overflow:hidden;background:var(--color-bg)';
      } else {
        stickyEl.style.cssText = '';
      }
    }

    // Fade out the fixed hero backdrop as we approach the footer reveal zone
    if (wasFixed) {
      const footer = document.querySelector('.footer') as HTMLElement;
      const footerH = footer ? footer.offsetHeight : 0;
      const distFromBottom = document.body.scrollHeight - scrolled - vh;
      const fadeZone = footerH + 50;
      if (distFromBottom < fadeZone) {
        const opacity = Math.max(0, distFromBottom / fadeZone);
        stickyEl.style.opacity = String(opacity);
        stickyEl.style.pointerEvents = opacity < 0.01 ? 'none' : '';
      } else {
        stickyEl.style.opacity = '1';
        stickyEl.style.pointerEvents = '';
      }
    }

    // Update CTA + dot label
    updateEnterCTA();
    updateDotLabel();
    recalcRects();

    ticking = false;
  }

  // Single scroll listener — cleaned up via AbortController on navigation
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true, signal });

  // ===== FLOATING BUBBLE — shared circle that slides between numbers =====
  function moveBubbleTo(index: number) {
    if (!bubbleEl || !pageNums[index]) return;
    const num = pageNums[index];
    const isHorizontal = pageNums.length > 1 && pageNums[0].offsetTop === pageNums[1].offsetTop;
    if (isHorizontal) {
      const x = num.offsetLeft + (num.offsetWidth - 42) / 2;
      bubbleEl.style.transform = `translate(${x}px, -50%)`;
    } else {
      const y = num.offsetTop + (num.offsetHeight - 42) / 2;
      bubbleEl.style.transform = `translate(-50%, ${y}px)`;
    }
    bubbleEl.style.opacity = '1';
  }

  // Init bubble position
  moveBubbleTo(0);

  // Pagination click — jump bubble straight to target, lock it until scroll settles
  pageNums.forEach((num, i) => {
    num.addEventListener('click', () => {
      bubbleLockedTo = i;
      moveBubbleTo(i);
      scrollToSlide(i);
    });
  });

  // Slide click — same lock behaviour as pagination
  slideEls.forEach((slide, i) => {
    slide.addEventListener('click', () => {
      if (i !== currentSlide) {
        bubbleLockedTo = i;
        moveBubbleTo(i);
        scrollToSlide(i);
      }
    });
  });

  // ===== CURSOR DOT =====
  let cursorX = 0, cursorY = 0;
  let targetX = 0, targetY = 0;
  let cursorVisible = false;
  let cursorRaf: number;

  // Hide the custom cursor entirely when touch input is used;
  // restore it as soon as a real mouse move is detected (handles hybrids).
  let isTouchInput = false;

  function enterTouchMode() {
    if (isTouchInput) return;
    isTouchInput = true;
    cursorVisible = false;
    dotEl.classList.remove('visible', 'show-label', 'arrow-left', 'arrow-right', 'eye-mode');
    stickyEl.classList.remove('cursor-active');
    cancelAnimationFrame(cursorRaf);
  }

  function enterMouseMode() {
    if (!isTouchInput) return;
    isTouchInput = false;
    // mouseenter will re-show the dot once the pointer enters the carousel
  }

  window.addEventListener('touchstart', enterTouchMode, { passive: true, signal });
  window.addEventListener('mousemove', enterMouseMode, { signal });

  function updateEnterCTA() {
    const isSettled = Math.abs(lastT) < 0.05 || (currentSlide === slideCount - 1 && lastT > 0.95);
    if (isSettled && enterEl) {
      const slug = slideEls[currentSlide]?.dataset.slug;
      if (slug) enterEl.href = `/gallery/${slug}`;
      if (enterCatEl) enterCatEl.textContent = content[currentSlide]?.main.replace(' &', '') || '';
      enterEl.classList.add('visible');
      // Scroll has settled — release bubble lock and snap to current slide
      if (bubbleLockedTo !== -1) {
        bubbleLockedTo = -1;
        moveBubbleTo(currentSlide);
      }
    } else if (enterEl) {
      enterEl.classList.remove('visible');
    }
  }

  stickyEl.addEventListener('mouseenter', () => {
    if (isTouchInput) return;
    cursorVisible = true;
    lastCursorTime = 0; // reset so first frame doesn't get a stale dt
    dotEl.classList.add('visible');
    stickyEl.classList.add('cursor-active');
    requestAnimationFrame(animateCursor);
    updateDotLabel();
  });

  stickyEl.addEventListener('mouseleave', () => {
    if (isTouchInput) return;
    cursorVisible = false;
    dotEl.classList.remove('visible', 'on-active', 'show-label');
    stickyEl.classList.remove('cursor-active');
    cancelAnimationFrame(cursorRaf);
  });

  let dotMode: 'dot' | 'arrow-left' | 'arrow-right' = 'dot';
  const edgeZonePct = 0.30; // 30% of viewport width

  let textRect: DOMRect | null = null;
  let paginationRect: DOMRect | null = null;

  function recalcRects() {
    if (heroTextEl) textRect = heroTextEl.getBoundingClientRect();
    if (paginationEl) paginationRect = paginationEl.getBoundingClientRect();
  }
  recalcRects();

  function pointInRect(x: number, y: number, r: DOMRect | null, pad = 0): boolean {
    if (!r) return false;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }

  stickyEl.addEventListener('mousemove', (e) => {
    if (isTouchInput) return;
    targetX = e.clientX;
    targetY = e.clientY;

    const isOverPagination = pointInRect(e.clientX, e.clientY, paginationRect, 10);
    const isOverText = pointInRect(e.clientX, e.clientY, textRect, 15);

    if (isOverPagination) {
      // Keep the inverting dot visible over pagination — just reset to plain dot mode
      dotEl.style.opacity = '';
      stickyEl.classList.add('cursor-active');
      dotMode = 'dot';
      dotEl.classList.remove('arrow-left', 'arrow-right', 'eye-mode');
      updateDotLabel();
      return;
    }

    dotEl.style.opacity = '';
    stickyEl.classList.add('cursor-active');

    if (isOverText) {
      dotMode = 'dot';
      dotEl.classList.remove('arrow-left', 'arrow-right');
      dotEl.classList.add('eye-mode');
      updateDotLabel();
      return;
    }

    dotEl.classList.remove('eye-mode');

    const vw = window.innerWidth;
    const edgeZone = vw * edgeZonePct;
    const overPag = pointInRect(e.clientX, e.clientY, paginationRect, 20);

    const newMode: typeof dotMode =
      e.clientX < edgeZone && !overPag && currentSlide > 0 ? 'arrow-left' :
      e.clientX > vw - edgeZone && currentSlide < slideCount - 1 ? 'arrow-right' :
      'dot';

    if (newMode !== dotMode) {
      dotMode = newMode;
      dotEl.classList.remove('arrow-left', 'arrow-right');
      if (dotMode !== 'dot') dotEl.classList.add(dotMode);
    }
    updateDotLabel();
  });

  // dot is always pointer-events:none so it never blocks hover on underlying elements.
  // We handle its logical clicks on stickyEl instead.
  stickyEl.addEventListener('click', (e) => {
    // Let heroTextEl's own click handler fire for the CTA area
    if ((e.target as HTMLElement).closest('.hero__text')) return;
    if (dotMode === 'arrow-left' && currentSlide > 0) {
      scrollToSlide(currentSlide - 1);
    } else if (dotMode === 'arrow-right' && currentSlide < slideCount - 1) {
      scrollToSlide(currentSlide + 1);
    }
  });

  function navigateToGallery() {
    if (!enterEl?.classList.contains('visible')) return;
    enterEl.click();
  }

  if (heroTextEl) {
    heroTextEl.addEventListener('click', navigateToGallery);
  }

  let lastCursorTime = 0;
  function animateCursor(now: number) {
    if (!lastCursorTime) lastCursorTime = now;
    const dt = (now - lastCursorTime) / 1000;
    lastCursorTime = now;
    // Exponential smoothing — frame-rate independent, consistent feel at 60/120/240 Hz
    const speed = 14; // higher = snappier, lower = more trailing
    const factor = 1 - Math.exp(-speed * dt);
    cursorX += (targetX - cursorX) * factor;
    cursorY += (targetY - cursorY) * factor;
    // CSS `translate` property composes with `transform` independently — GPU only, no layout
    dotEl.style.translate = `${cursorX}px ${cursorY}px`;
    if (cursorVisible) cursorRaf = requestAnimationFrame(animateCursor);
  }

  function updateDotLabel() {
    const isSettled = Math.abs(lastT) < 0.05 || (currentSlide === slideCount - 1 && lastT > 0.95);
    const isArrow = dotMode !== 'dot';
    dotEl.classList.toggle('show-label', isSettled && cursorVisible && !isArrow);
  }

  // ===== SCROLL SNAP =====
  let snapTimer: ReturnType<typeof setTimeout>;
  let userScrolling = false;

  window.addEventListener('wheel', () => {
    userScrolling = true;
    clearTimeout(snapTimer);
    snapTimer = setTimeout(trySnap, 150);
  }, { passive: true, signal });

  window.addEventListener('touchend', () => {
    if (userScrolling) {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(trySnap, 150);
    }
  }, { passive: true, signal });

  window.addEventListener('touchstart', () => {
    userScrolling = true;
    clearTimeout(snapTimer);
  }, { passive: true, signal });

  function trySnap() {
    userScrolling = false;
    const scrolled = Math.max(0, window.scrollY - heroTop);
    const progress = scrolled / carouselHeight;

    if (progress <= 0 || progress >= 0.98) return;

    const slideProgress = progress * (slideCount - 1);
    const nearestSlide = Math.round(slideProgress);
    const dist = Math.abs(slideProgress - nearestSlide);

    if (dist < 0.4 && dist > 0.02) {
      const targetScroll = heroTop + (nearestSlide / (slideCount - 1)) * carouselHeight;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }

  function scrollToSlide(i: number) {
    clearTimeout(snapTimer);
    userScrolling = false;
    const targetScroll = heroTop + (i / (slideCount - 1)) * carouselHeight;
    window.scrollTo(0, targetScroll);
  }

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    const scrolled = Math.max(0, window.scrollY - heroTop);
    const progress = Math.min(1, scrolled / carouselHeight);
    if (scrolled > carouselHeight * 1.05 || window.scrollY < heroTop - vh) return;

    const nearestSlide = Math.round(progress * (slideCount - 1));

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (nearestSlide >= slideCount - 1) {
        document.querySelector('.reveal-section__sticky')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        scrollToSlide(nearestSlide + 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      scrollToSlide(Math.max(nearestSlide - 1, 0));
    }
  }, { signal });

  // Mouse drag
  let mouseStartX = 0, mouseStartTime = 0, isMouseDragging = false;

  stickyEl.addEventListener('mousedown', (e) => {
    mouseStartX = e.clientX; mouseStartTime = Date.now(); isMouseDragging = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (!isMouseDragging) return;
    isMouseDragging = false;
    const dx = e.clientX - mouseStartX, dt = Date.now() - mouseStartTime;
    if (Math.abs(dx) > 60 && dt < 500) {
      if (dx < 0 && currentSlide < slideCount - 1) scrollToSlide(currentSlide + 1);
      else if (dx > 0 && currentSlide > 0) scrollToSlide(currentSlide - 1);
    }
  }, { signal });

  // Init — snap everything directly to the actual scroll position
  headingMain.textContent = content[0].main;
  headingAccent.textContent = content[0].accent;
  desc.textContent = content[0].desc;
  pageFill.style.height = '0%';
  update(); // isInitialRender=true → snaps slides, text, and bubble directly
  isInitialRender = false;
}); // end astro:page-load
