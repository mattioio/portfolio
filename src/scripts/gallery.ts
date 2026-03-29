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

  const lbImg = lightbox.querySelector(".lightbox__img") as HTMLImageElement;
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

  // ── Toolbar auto-hide on mobile ──
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  const isMobile = () => window.innerWidth <= 600;

  function showToolbar() {
    toolbar?.classList.remove('hidden');
    restartHideTimer();
  }

  function restartHideTimer() {
    if (hideTimer) clearTimeout(hideTimer);
    if (!isMobile()) return;
    hideTimer = setTimeout(() => {
      // Don't hide if zoomed — user may need controls
      if (scale > 1) return;
      toolbar?.classList.add('hidden');
    }, 3000);
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
    showToolbar();
    showGestureHint();
  }

  function close() {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (navEl) navEl.style.display = '';
    if (catBar) catBar.style.display = '';
    if (hideTimer) clearTimeout(hideTimer);
    resetTransform();
  }

  function show() {
    lbImg.src = sources[currentIndex];
    lbImg.alt = `Photo ${currentIndex + 1} of ${sources.length}`;
    lbCounter.textContent = `${currentIndex + 1} / ${sources.length}`;
    // Preload adjacent
    [currentIndex - 1, currentIndex + 1].forEach((i) => {
      if (i >= 0 && i < sources.length) {
        const img = new Image();
        img.src = sources[i];
      }
    });
  }

  function next() {
    currentIndex = (currentIndex + 1) % sources.length;
    scale = 1; panX = 0; panY = 0;
    lbImg.style.transform = '';
    show();
    showToolbar();
  }

  function prev() {
    currentIndex = (currentIndex - 1 + sources.length) % sources.length;
    scale = 1; panX = 0; panY = 0;
    lbImg.style.transform = '';
    show();
    showToolbar();
  }

  items.forEach((item, i) => {
    item.addEventListener("click", () => open(i));
  });

  lightbox.querySelector(".lightbox__close")!.addEventListener("click", close);
  lightbox.querySelector(".lightbox__prev")!.addEventListener("click", prev);
  lightbox.querySelector(".lightbox__next")!.addEventListener("click", next);

  // Tap on image area (not toolbar) — toggle toolbar on mobile, close on desktop
  lightbox.querySelector('.lightbox__image-wrap')!.addEventListener("click", (e) => {
    if (e.target === lbImg || (e.target as Element).classList.contains("lightbox__image-wrap")) {
      if (isMobile()) {
        // Toggle toolbar visibility
        toolbar?.classList.toggle('hidden');
        if (!toolbar?.classList.contains('hidden')) restartHideTimer();
      } else {
        close();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  // ===== Mobile: pinch-to-zoom, pan, and swipe =====
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
  let isPinching = false;

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
      startPanX = panX;
      startPanY = panY;
      isPanning = scale > 1;
    }
  }, { passive: false });

  let isPanning = false;

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
        e.preventDefault();
        panX = startPanX + dx;
        panY = startPanY + dy;
        applyTransform();
      }
    }
  }, { passive: false });

  imageWrap.addEventListener('touchend', (e) => {
    if (isPinching) {
      isPinching = false;
      if (scale <= 1.1) {
        scale = 1;
        panX = 0;
        panY = 0;
        lbImg.style.transition = 'transform 0.2s ease';
        lbImg.style.transform = '';
      }
      return;
    }

    // Single touch end — handle swipe if not zoomed
    if (scale <= 1 && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        resetTransform();
        dx > 0 ? prev() : next();
      } else if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx)) {
        close();
        resetTransform();
      }
    }
  });

  // Double-tap to zoom on mobile
  let lastTap = 0;
  imageWrap.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1 || isPinching) return;
    const now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
      if (scale > 1) {
        scale = 1;
        panX = 0;
        panY = 0;
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
      showToolbar();
    }
    lastTap = now;
  });

}); // end astro:page-load
