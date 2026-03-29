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
    document.body.style.overflow = "";
    if (navEl) navEl.style.display = '';
    if (catBar) catBar.style.display = '';
    resetTransform();
    resetStaging();
  }

  function show() {
    lbImg.src = sources[currentIndex];
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

  function next() {
    if (currentIndex >= sources.length - 1) { currentIndex = 0; } else { currentIndex++; }
    scale = 1; panX = 0; panY = 0;
    lbImg.style.transform = '';
    show();
  }

  function prev() {
    if (currentIndex <= 0) { currentIndex = sources.length - 1; } else { currentIndex--; }
    scale = 1; panX = 0; panY = 0;
    lbImg.style.transform = '';
    show();
  }

  // Reset staging image to hidden
  function resetStaging() {
    stagingImg.style.opacity = '0';
    stagingImg.style.transform = '';
    stagingImg.style.transition = '';
    stagingImg.src = '';
  }

  items.forEach((item, i) => {
    item.addEventListener("click", () => open(i));
  });

  lightbox.querySelector(".lightbox__close")!.addEventListener("click", close);
  lightbox.querySelector(".lightbox__prev")!.addEventListener("click", prev);
  lightbox.querySelector(".lightbox__next")!.addEventListener("click", next);

  // Click dark area (not the image) to close
  lightbox.querySelector('.lightbox__image-wrap')!.addEventListener("click", (e) => {
    if ((e.target as Element).classList.contains("lightbox__image-wrap")) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
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

  // Prepare staging image for a swipe direction
  function prepareStaging(dir: 'left' | 'right') {
    const nextIdx = dir === 'left'
      ? (currentIndex + 1) % sources.length
      : (currentIndex - 1 + sources.length) % sources.length;
    stagingImg.src = sources[nextIdx];
    stagingImg.alt = `Photo ${nextIdx + 1} of ${sources.length}`;
    stagingImg.style.opacity = '1';
    stagingImg.style.transition = 'none';
    stagingDirection = dir;
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
          if (!stagingDirection) {
            prepareStaging(dx < 0 ? 'left' : 'right');
          }
          // If user reverses direction, re-prepare
          if ((dx < 0 && stagingDirection === 'right') || (dx > 0 && stagingDirection === 'left')) {
            prepareStaging(dx < 0 ? 'left' : 'right');
          }

          // Move current image
          lbImg.style.transition = 'none';
          lbImg.style.transform = `translateX(${dx}px)`;
          // Move staging image
          positionStaging(dx);

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
        const threshold = vw() * 0.25;
        const shouldComplete = Math.abs(dx) > threshold || velocity > 0.5;
        const dur = '0.3s';
        const ease = 'cubic-bezier(0.2, 0.9, 0.3, 1)';

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
            // Update index and swap
            if (goingLeft) {
              currentIndex = (currentIndex + 1) % sources.length;
            } else {
              currentIndex = (currentIndex - 1 + sources.length) % sources.length;
            }
            show();
            lbImg.style.transition = '';
            lbImg.style.transform = '';
            resetStaging();
            swipeLocked = false;
          }, 300);
        } else {
          // Snap back — rubber-band both images to original positions
          lbImg.style.transition = `transform ${dur} ${ease}`;
          lbImg.style.transform = '';

          if (stagingDirection) {
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

}); // end astro:page-load
