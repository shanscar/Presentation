(() => {
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  const progressFill = document.getElementById('progress-fill');
  const slideCounter = document.getElementById('slide-counter');

  let current = 0;
  let isAnimating = false;
  let sidebarOpen = false;

  // Accent colors for progress bar
  const accentMap = {
    'accent-blue': '#6b9bd2',
    'accent-coral': '#d4816b',
    'accent-sage': '#7bb08a',
    'accent-lavender': '#9b8ec4',
    'accent-amber': '#c9a84c',
  };

  function getSlideAccent(slide) {
    for (const cls of Object.keys(accentMap)) {
      if (slide.classList.contains(cls)) return accentMap[cls];
    }
    return accentMap['accent-blue'];
  }

  function goTo(index) {
    if (index < 0 || index >= total || index === current || isAnimating) return;
    isAnimating = true;

    const prev = slides[current];
    const next = slides[index];

    prev.classList.remove('active');
    prev.classList.add('prev');
    next.classList.add('active');

    // Update progress
    const pct = ((index + 1) / total) * 100;
    progressFill.style.width = pct + '%';
    progressFill.style.background = getSlideAccent(next);

    // Update counter
    slideCounter.textContent = (index + 1) + ' / ' + total;

    // Update hash
    history.replaceState(null, '', '#slide-' + (index + 1));

    current = index;
    updateThumbHighlight();

    setTimeout(() => {
      prev.classList.remove('prev');
      isAnimating = false;
    }, 460);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      toggleSidebar();
      return;
    }
    if (e.key === 'Escape' && sidebarOpen) {
      e.preventDefault();
      toggleSidebar(false);
      return;
    }
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        prev();
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(total - 1);
        break;
    }
  });

  // Trackpad / mouse wheel navigation (accumulated delta + threshold)
  let accumulatedDelta = 0;
  let wheelCooldown = false;
  let idleTimer = null;

  document.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelCooldown) return;

    // Use the dominant axis
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    accumulatedDelta += delta;

    // Reset idle timer — if no wheel events for 150ms, clear accumulated delta
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { accumulatedDelta = 0; }, 150);

    // Trigger navigation when threshold exceeded
    if (Math.abs(accumulatedDelta) > 150) {
      if (accumulatedDelta > 0) next();
      else prev();

      accumulatedDelta = 0;
      wheelCooldown = true;
      setTimeout(() => { wheelCooldown = false; }, 600);
    }
  }, { passive: false });

  // Touch / swipe support
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 50) return; // too short

    if (absDx >= absDy) {
      dx < 0 ? next() : prev();
    } else {
      dy < 0 ? next() : prev();
    }
  }, { passive: true });

  // Hash-based initial slide
  function initFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/^#slide-(\d+)$/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < total) {
        current = idx;
      }
    }
    slides[current].classList.add('active');

    const pct = ((current + 1) / total) * 100;
    progressFill.style.width = pct + '%';
    progressFill.style.background = getSlideAccent(slides[current]);
    slideCounter.textContent = (current + 1) + ' / ' + total;
  }

  // Progress bar click-to-jump
  const progressBar = document.getElementById('progress-bar');
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const targetIndex = Math.round(ratio * (total - 1));
    goTo(targetIndex);
  });

  // ===== Sidebar =====
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const thumbItems = [];

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'sidebar-backdrop';
  document.body.appendChild(backdrop);

  // Build thumbnail list
  slides.forEach((slide, i) => {
    const item = document.createElement('div');
    item.className = 'thumb-item' + (i === current ? ' active' : '');

    // Clone slide content as mini preview
    const inner = document.createElement('div');
    inner.className = 'thumb-item-inner';
    inner.innerHTML = slide.innerHTML;

    // Copy slide background & border styles
    const computed = getComputedStyle(slide);
    inner.style.background = computed.background;
    inner.style.borderLeft = computed.borderLeft;
    inner.style.display = 'flex';
    inner.style.alignItems = 'center';
    inner.style.justifyContent = 'center';
    inner.style.padding = '60px 80px';

    const label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = (i + 1);

    item.appendChild(inner);
    item.appendChild(label);
    sidebar.appendChild(item);
    thumbItems.push(item);

    item.addEventListener('click', () => {
      goTo(i);
      toggleSidebar(false);
    });
  });

  // Scale thumbnails to fit
  function scaleThumbItems() {
    const thumbWidth = sidebar.clientWidth - 24; // account for padding
    const scale = thumbWidth / 1920;
    thumbItems.forEach((item) => {
      const inner = item.querySelector('.thumb-item-inner');
      inner.style.transform = 'scale(' + scale + ')';
    });
  }
  scaleThumbItems();
  window.addEventListener('resize', scaleThumbItems);

  function updateThumbHighlight() {
    thumbItems.forEach((item, i) => {
      item.classList.toggle('active', i === current);
    });
    // Scroll active thumb into view
    if (sidebarOpen && thumbItems[current]) {
      thumbItems[current].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function toggleSidebar(forceState) {
    sidebarOpen = typeof forceState === 'boolean' ? forceState : !sidebarOpen;
    sidebar.classList.toggle('open', sidebarOpen);
    backdrop.classList.toggle('visible', sidebarOpen);
    if (sidebarOpen) {
      updateThumbHighlight();
    }
  }

  sidebarToggle.addEventListener('click', () => toggleSidebar());
  backdrop.addEventListener('click', () => toggleSidebar(false));

  initFromHash();
  updateThumbHighlight();
})();
