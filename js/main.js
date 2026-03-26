(() => {
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  const progressFill = document.getElementById('progress-fill');
  const slideCounter = document.getElementById('slide-counter');

  let current = 0;
  let isAnimating = false;

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

    setTimeout(() => {
      prev.classList.remove('prev');
      isAnimating = false;
    }, 460);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
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

  // Trackpad / mouse wheel navigation (debounced)
  let wheelTimeout = null;
  document.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelTimeout) return;

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if (e.deltaY > 0) next();
      else prev();
    } else {
      if (e.deltaX > 0) next();
      else prev();
    }

    wheelTimeout = setTimeout(() => {
      wheelTimeout = null;
    }, 600);
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

  initFromHash();
})();
